import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../db/schema";
import type { AppVariables } from "../app";

export const categoriesRoutes = new Hono<{ Variables: AppVariables }>();

categoriesRoutes.get("/", async (c) => {
  const rows = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.name));
  return c.json(
    rows.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      image: cat.imageKey,
      imageKey: cat.imageKey,
      featured: cat.featured,
    })),
  );
});

categoriesRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({
    id: row.id,
    name: row.name,
    description: row.description,
    image: row.imageKey,
    imageKey: row.imageKey,
    featured: row.featured,
  });
});
