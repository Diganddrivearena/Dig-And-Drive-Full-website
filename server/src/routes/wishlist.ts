import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { products, wishlist } from "../db/schema";
import type { AppVariables } from "../app";
import { requireAuth } from "../middleware";

export const wishlistRoutes = new Hono<{ Variables: AppVariables }>();

wishlistRoutes.get("/", requireAuth, async (c) => {
  const user = c.get("user")!;
  const rows = await db
    .select({
      id: wishlist.id,
      productId: wishlist.productId,
      createdAt: wishlist.createdAt,
      product: products,
    })
    .from(wishlist)
    .innerJoin(products, eq(wishlist.productId, products.id))
    .where(eq(wishlist.userId, user.id))
    .orderBy(desc(wishlist.createdAt));

  return c.json(
    rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      createdAt: r.createdAt,
      product: {
        id: r.product.id,
        name: r.product.name,
        slug: r.product.slug,
        price: r.product.price,
        originalPrice: r.product.originalPrice ?? undefined,
        category: r.product.category,
        image: r.product.imageKey,
        inStock: r.product.inStock,
        active: r.product.active,
      },
    })),
  );
});

wishlistRoutes.post("/", requireAuth, async (c) => {
  const user = c.get("user")!;
  const body = z
    .object({ productId: z.number().int().positive() })
    .safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: "productId is required" }, 400);
  }

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, body.data.productId))
    .limit(1);
  if (!product || !product.active) {
    return c.json({ error: "Product not found" }, 404);
  }

  const [existing] = await db
    .select()
    .from(wishlist)
    .where(
      and(
        eq(wishlist.userId, user.id),
        eq(wishlist.productId, body.data.productId),
      ),
    )
    .limit(1);
  if (existing) return c.json({ ok: true, id: existing.id });

  const [row] = await db
    .insert(wishlist)
    .values({ userId: user.id, productId: body.data.productId })
    .returning();
  return c.json({ ok: true, id: row.id }, 201);
});

wishlistRoutes.delete("/:productId", requireAuth, async (c) => {
  const user = c.get("user")!;
  const productId = Number(c.req.param("productId"));
  if (!Number.isFinite(productId)) {
    return c.json({ error: "Invalid productId" }, 400);
  }

  await db
    .delete(wishlist)
    .where(
      and(eq(wishlist.userId, user.id), eq(wishlist.productId, productId)),
    );
  return c.json({ ok: true });
});
