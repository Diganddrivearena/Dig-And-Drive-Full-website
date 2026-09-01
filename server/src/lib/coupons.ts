import type { Coupon } from "../db/schema";

export function computeDiscount(coupon: Coupon, cartTotal: number): number {
  const value = Number(coupon.value);
  if (coupon.type === "percent") {
    return Math.min(cartTotal, Math.round((cartTotal * value) / 100));
  }
  return Math.min(cartTotal, Math.round(value));
}
