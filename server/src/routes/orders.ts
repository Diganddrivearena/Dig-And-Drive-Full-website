import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { orders, orderItems, payments, products } from "../db/schema";
import type { AppVariables } from "../app";
import { requireAuth } from "../middleware";

export const ordersRoutes = new Hono<{ Variables: AppVariables }>();

async function enrichOrder(order: typeof orders.$inferSelect) {
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const enrichedItems = [];
  for (const item of items) {
    let imageKey = item.imageKey || "";
    if (!imageKey && item.productId) {
      const [product] = await db
        .select({ imageKey: products.imageKey })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);
      imageKey = product?.imageKey ?? "";
    }
    enrichedItems.push({
      id: item.id,
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      imageKey,
      image: imageKey,
    });
  }

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, order.id))
    .limit(1);

  return {
    ...order,
    items: enrichedItems,
    payment: payment
      ? { razorpayOrderId: payment.razorpayOrderId, status: payment.status }
      : null,
  };
}

ordersRoutes.get("/", requireAuth, async (c) => {
  const user = c.get("user")!;
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.id))
    .limit(100);

  const result = [];
  for (const order of rows) {
    result.push(await enrichOrder(order));
  }
  return c.json(result);
});

ordersRoutes.get("/:id", requireAuth, async (c) => {
  const user = c.get("user")!;
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) return c.json({ error: "Invalid id" }, 400);

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order || order.userId !== user.id) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(await enrichOrder(order));
});
