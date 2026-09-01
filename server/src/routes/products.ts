import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db";
import { products } from "../db/schema";
import type { AppVariables } from "../app";

export const productsRoutes = new Hono<{ Variables: AppVariables }>();

function mapProduct(p: typeof products.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    originalPrice: p.originalPrice ?? undefined,
    category: p.category,
    image: p.imageKey,
    description: p.description,
    specs: p.specs ?? [],
    active: p.active,
    featured: p.featured,
    bestSeller: p.bestSeller,
    inStock: p.inStock,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
  };
}

productsRoutes.get("/", async (c) => {
  const category = c.req.query("category");
  const rows = await db
    .select()
    .from(products)
    .where(
      category
        ? and(eq(products.active, true), eq(products.category, category))
        : eq(products.active, true),
    )
    .orderBy(asc(products.sortOrder), asc(products.id));

  return c.json(rows.map(mapProduct));
});

productsRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.active, true)))
    .limit(1);

  if (!row) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(mapProduct(row));
});
