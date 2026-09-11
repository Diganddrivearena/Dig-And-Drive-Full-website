import { Hono } from "hono";
import { and, avg, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { products, reviews, user as userTable } from "../db/schema";
import type { AppVariables } from "../app";
import { requireAuth } from "../middleware";

export const reviewsRoutes = new Hono<{ Variables: AppVariables }>();

reviewsRoutes.get("/product/:slug", async (c) => {
  const slug = c.req.param("slug");
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  if (!product) return c.json({ error: "Product not found" }, 404);

  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      userName: userTable.name,
      userId: reviews.userId,
    })
    .from(reviews)
    .innerJoin(userTable, eq(reviews.userId, userTable.id))
    .where(eq(reviews.productId, product.id))
    .orderBy(desc(reviews.createdAt));

  const [stats] = await db
    .select({
      average: avg(reviews.rating),
      count: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.productId, product.id));

  return c.json({
    productId: product.id,
    average: stats?.average ? Number(stats.average) : 0,
    count: Number(stats?.count ?? 0),
    reviews: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      userName: r.userName,
      userId: r.userId,
    })),
  });
});

reviewsRoutes.post("/", requireAuth, async (c) => {
  const user = c.get("user")!;
  const body = z
    .object({
      productId: z.number().int().positive(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().max(1000).optional().default(""),
    })
    .safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: body.error.flatten() }, 400);
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
    .from(reviews)
    .where(
      and(
        eq(reviews.productId, body.data.productId),
        eq(reviews.userId, user.id),
      ),
    )
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(reviews)
      .set({
        rating: body.data.rating,
        comment: body.data.comment.trim(),
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, existing.id))
      .returning();
    return c.json(row);
  }

  const [row] = await db
    .insert(reviews)
    .values({
      productId: body.data.productId,
      userId: user.id,
      rating: body.data.rating,
      comment: body.data.comment.trim(),
      updatedAt: new Date(),
    })
    .returning();
  return c.json(row, 201);
});
