import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
  products,
  coupons,
  orders,
  orderItems,
  payments,
} from "../db/schema";
import type { AppVariables } from "../app";
import { requireAuth } from "../middleware";
import { computeDiscount } from "../lib/coupons";
import { getRazorpay, verifyPaymentSignature, fetchCapturedPayment } from "../lib/razorpay";
import {
  normalizeIndianPhone,
  notifyOrderPaid,
} from "../lib/fast2sms";

export const checkoutRoutes = new Hono<{ Variables: AppVariables }>();

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  couponCode: z.string().optional(),
  phone: z.string().min(10).max(15),
});

checkoutRoutes.post("/create-order", requireAuth, async (c) => {
  const user = c.get("user")!;
  const parsed = createOrderSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { items, couponCode, phone: rawPhone } = parsed.data;
  const phone = normalizeIndianPhone(rawPhone);
  if (!phone) {
    return c.json(
      { error: "Enter a valid 10-digit Indian mobile number for WhatsApp confirmation" },
      400,
    );
  }

  const lineItems: {
    productId: number;
    name: string;
    price: number;
    quantity: number;
    imageKey: string;
  }[] = [];

  let subtotal = 0;
  for (const item of items) {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);
    if (!product || !product.active) {
      return c.json({ error: `Product ${item.productId} unavailable` }, 400);
    }
    lineItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      imageKey: product.imageKey,
    });
    subtotal += product.price * item.quantity;
  }

  let discount = 0;
  let appliedCode: string | null = null;
  if (couponCode?.trim()) {
    const code = couponCode.trim().toUpperCase();
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code))
      .limit(1);
    if (!coupon || !coupon.active) {
      return c.json({ error: "Invalid coupon" }, 400);
    }
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return c.json({ error: "Coupon not active yet" }, 400);
    }
    if (coupon.endsAt && coupon.endsAt < now) {
      return c.json({ error: "Coupon expired" }, 400);
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return c.json({ error: "Coupon usage limit reached" }, 400);
    }
    if (subtotal < coupon.minOrder) {
      return c.json({ error: `Minimum order ₹${coupon.minOrder}` }, 400);
    }
    discount = computeDiscount(coupon, subtotal);
    appliedCode = coupon.code;
  }

  const total = Math.max(0, subtotal - discount);
  if (total < 1) {
    return c.json({ error: "Order total must be at least ₹1" }, 400);
  }

  const [order] = await db
    .insert(orders)
    .values({
      userId: user.id,
      email: user.email,
      phone,
      status: "pending",
      subtotal,
      discount,
      total,
      couponCode: appliedCode,
      updatedAt: new Date(),
    })
    .returning();

  await db.insert(orderItems).values(
    lineItems.map((li) => ({
      orderId: order.id,
      productId: li.productId,
      name: li.name,
      price: li.price,
      quantity: li.quantity,
      imageKey: li.imageKey,
    })),
  );

  const razorpay = getRazorpay();
  const rzpOrder = await razorpay.orders.create({
    amount: total * 100,
    currency: "INR",
    receipt: `order_${order.id}`,
    notes: {
      orderId: String(order.id),
      userId: user.id,
    },
  });

  await db.insert(payments).values({
    orderId: order.id,
    razorpayOrderId: rzpOrder.id,
    status: "created",
    amount: total,
    currency: "INR",
    updatedAt: new Date(),
  });

  return c.json({
    orderId: order.id,
    razorpayOrderId: rzpOrder.id,
    amount: total,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
    discount,
    subtotal,
  });
});

const verifySchema = z.object({
  orderId: z.number().int().positive(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

checkoutRoutes.post("/verify", requireAuth, async (c) => {
  const user = c.get("user")!;
  const parsed = verifySchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
    parsed.data;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order || (order.userId && order.userId !== user.id)) {
    return c.json({ error: "Order not found" }, 404);
  }

  const ok = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!ok) {
    await db
      .update(orders)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    return c.json({ error: "Invalid payment signature" }, 400);
  }

  let captured = false;
  try {
    const fetched = await fetchCapturedPayment(razorpayPaymentId);
    captured = fetched.captured;
    if (fetched.payment.order_id && fetched.payment.order_id !== razorpayOrderId) {
      captured = false;
    }
  } catch (err) {
    console.error("[checkout] Razorpay payment fetch failed", err);
    return c.json({ error: "Could not confirm payment with Razorpay" }, 400);
  }

  if (!captured) {
    await db
      .update(orders)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    return c.json({ error: "Payment is not completed" }, 400);
  }

  if (order.status === "paid") {
    return c.json({
      ok: true,
      orderId,
      status: "paid",
      notifications: {
        customerWhatsApp: false,
        customerSms: false,
        adminSms: false,
      },
    });
  }

  await db
    .update(orders)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  await db
    .update(payments)
    .set({
      razorpayPaymentId,
      razorpaySignature,
      status: "captured",
      updatedAt: new Date(),
    })
    .where(eq(payments.razorpayOrderId, razorpayOrderId));

  if (order.couponCode) {
    await db
      .update(coupons)
      .set({
        usedCount: sql`${coupons.usedCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(coupons.code, order.couponCode));
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const notifications = await notifyOrderPaid({
    orderId,
    customerName: user.name || "Customer",
    phone: order.phone || "",
    email: order.email,
    items: items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    couponCode: order.couponCode,
  }).catch((err) => {
    console.error("[fast2sms] notify failed", err);
    return {
      customerWhatsApp: false,
      customerSms: false,
      adminSms: false,
    };
  });

  return c.json({ ok: true, orderId, status: "paid", notifications });
});
