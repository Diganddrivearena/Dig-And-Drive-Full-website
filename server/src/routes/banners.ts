import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { db } from "../db";
import { banners } from "../db/schema";
import type { AppVariables } from "../app";

export const bannersRoutes = new Hono<{ Variables: AppVariables }>();

bannersRoutes.get("/", async (c) => {
  const rows = await db
    .select()
    .from(banners)
    .where(eq(banners.active, true))
    .orderBy(asc(banners.sortOrder), asc(banners.id));

  return c.json(
    rows.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
      sortOrder: b.sortOrder,
    })),
  );
});
