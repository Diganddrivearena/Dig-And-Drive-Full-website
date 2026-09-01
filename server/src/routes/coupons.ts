import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { coupons } from "../db/schema";
import type { AppVariables } from "../app";
import { computeDiscount } from "../lib/coupons";

export const couponsRoutes = new Hono<{ Variables: AppVariables }>();

couponsRoutes.post("/validate", async (c) => {
  const body = await c.req.json<{ code?: string; cartTotal?: number }>();
  const code = (body.code ?? "").trim().toUpperCase();
  const cartTotal = Number(body.cartTotal ?? 0);

  if (!code) {
    return c.json({ error: "Coupon code is required" }, 400);
  }

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code))
    .limit(1);

  if (!coupon || !coupon.active) {
    return c.json({ valid: false, error: "Invalid coupon code" }, 400);
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return c.json({ valid: false, error: "Coupon is not active yet" }, 400);
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return c.json({ valid: false, error: "Coupon has expired" }, 400);
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return c.json({ valid: false, error: "Coupon usage limit reached" }, 400);
  }
  if (cartTotal < coupon.minOrder) {
    return c.json(
      {
        valid: false,
        error: `Minimum order of ₹${coupon.minOrder} required`,
      },
      400,
    );
  }

  const discount = computeDiscount(coupon, cartTotal);
  return c.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    discount,
    total: Math.max(0, cartTotal - discount),
  });
});
