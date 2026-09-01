import { Hono } from "hono";
import { eq, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { db } from "../db";
import {
  products,
  coupons,
  banners,
  orders,
  orderItems,
  payments,
  user,
} from "../db/schema";
import type { AppVariables } from "../app";
import { requireAdmin } from "../middleware";

export const adminRoutes = new Hono<{ Variables: AppVariables }>();

adminRoutes.use("*", requireAdmin);

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  price: z.number().int().positive(),
  originalPrice: z.number().int().positive().nullable().optional(),
  category: z.string().min(1),
  imageKey: z.string().min(1),
  description: z.string().optional().default(""),
  specs: z.array(z.string()).optional().default([]),
  active: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  bestSeller: z.boolean().optional().default(false),
  inStock: z.boolean().optional().default(true),
});

adminRoutes.get("/products", async (c) => {
  const rows = await db
    .select()
    .from(products)
    .orderBy(asc(products.sortOrder), asc(products.id));
  return c.json(
    rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      originalPrice: p.originalPrice,
      category: p.category,
      image: p.imageKey,
      imageKey: p.imageKey,
      description: p.description,
      specs: p.specs ?? [],
      active: p.active,
      featured: p.featured,
      bestSeller: p.bestSeller,
      inStock: p.inStock,
      sortOrder: p.sortOrder,
      createdAt: p.createdAt,
    })),
  );
});

adminRoutes.post("/products/reorder", async (c) => {
  const body = z
    .object({ orderedIds: z.array(z.number().int().positive()).min(1) })
    .safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: body.error.flatten() }, 400);
  }
  const { orderedIds } = body.data;
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(products)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(products.id, id)),
    ),
  );
  return c.json({ ok: true });
});

adminRoutes.post("/products", async (c) => {
  const parsed = productSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const data = parsed.data;
  const [{ max }] = await db
    .select({ max: products.sortOrder })
    .from(products)
    .orderBy(desc(products.sortOrder))
    .limit(1)
    .then(async (rows) => {
      if (rows.length) return rows;
      return [{ max: -1 }];
    });

  const [row] = await db
    .insert(products)
    .values({
      name: data.name,
      slug: data.slug,
      price: data.price,
      originalPrice: data.originalPrice ?? null,
      category: data.category,
      imageKey: data.imageKey,
      description: data.description,
      specs: data.specs,
      active: data.active,
      featured: data.featured,
      bestSeller: data.bestSeller,
      inStock: data.inStock,
      sortOrder: (max ?? -1) + 1,
      updatedAt: new Date(),
    })
    .returning();
  return c.json(row, 201);
});

adminRoutes.patch("/products/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const parsed = productSchema.partial().safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const data = parsed.data;
  const [row] = await db
    .update(products)
    .set({
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.slug !== undefined ? { slug: data.slug } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.originalPrice !== undefined
        ? { originalPrice: data.originalPrice }
        : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.imageKey !== undefined ? { imageKey: data.imageKey } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.specs !== undefined ? { specs: data.specs } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.featured !== undefined ? { featured: data.featured } : {}),
      ...(data.bestSeller !== undefined ? { bestSeller: data.bestSeller } : {}),
      ...(data.inStock !== undefined ? { inStock: data.inStock } : {}),
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();

  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

adminRoutes.delete("/products/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [row] = await db
    .update(products)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

const couponSchema = z.object({
  code: z.string().min(1),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  minOrder: z.number().int().nonnegative().optional().default(0),
  maxUses: z.number().int().positive().nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  active: z.boolean().optional().default(true),
});

adminRoutes.get("/coupons", async (c) => {
  const rows = await db.select().from(coupons).orderBy(desc(coupons.id));
  return c.json(rows);
});

adminRoutes.post("/coupons", async (c) => {
  const parsed = couponSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const data = parsed.data;
  const [row] = await db
    .insert(coupons)
    .values({
      code: data.code.trim().toUpperCase(),
      type: data.type,
      value: String(data.value),
      minOrder: data.minOrder,
      maxUses: data.maxUses ?? null,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      active: data.active,
      updatedAt: new Date(),
    })
    .returning();
  return c.json(row, 201);
});

adminRoutes.patch("/coupons/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const parsed = couponSchema.partial().safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const data = parsed.data;
  const [row] = await db
    .update(coupons)
    .set({
      ...(data.code !== undefined ? { code: data.code.trim().toUpperCase() } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.value !== undefined ? { value: String(data.value) } : {}),
      ...(data.minOrder !== undefined ? { minOrder: data.minOrder } : {}),
      ...(data.maxUses !== undefined ? { maxUses: data.maxUses } : {}),
      ...(data.startsAt !== undefined
        ? { startsAt: data.startsAt ? new Date(data.startsAt) : null }
        : {}),
      ...(data.endsAt !== undefined
        ? { endsAt: data.endsAt ? new Date(data.endsAt) : null }
        : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      updatedAt: new Date(),
    })
    .where(eq(coupons.id, id))
    .returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

adminRoutes.delete("/coupons/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [row] = await db.delete(coupons).where(eq(coupons.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

const bannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
  linkUrl: z.string().optional().default(""),
  sortOrder: z.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
});

adminRoutes.get("/banners", async (c) => {
  const rows = await db
    .select()
    .from(banners)
    .orderBy(asc(banners.sortOrder), asc(banners.id));
  return c.json(rows);
});

adminRoutes.post("/banners", async (c) => {
  const parsed = bannerSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const data = parsed.data;
  const [row] = await db
    .insert(banners)
    .values({
      title: data.title,
      subtitle: data.subtitle,
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl,
      sortOrder: data.sortOrder,
      active: data.active,
      updatedAt: new Date(),
    })
    .returning();
  return c.json(row, 201);
});

adminRoutes.patch("/banners/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const parsed = bannerSchema.partial().safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const data = parsed.data;
  const [row] = await db
    .update(banners)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(banners.id, id))
    .returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

adminRoutes.delete("/banners/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [row] = await db.delete(banners).where(eq(banners.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

adminRoutes.post("/banners/reorder", async (c) => {
  const body = z
    .object({ orderedIds: z.array(z.number().int().positive()).min(1) })
    .safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: body.error.flatten() }, 400);
  }
  await Promise.all(
    body.data.orderedIds.map((id, index) =>
      db
        .update(banners)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(banners.id, id)),
    ),
  );
  return c.json({ ok: true });
});

adminRoutes.post("/banners/upload", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || !(file instanceof File)) {
    return c.json({ error: "file is required" }, 400);
  }
  if (!file.type.startsWith("image/")) {
    return c.json({ error: "Only image uploads are allowed" }, 400);
  }
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: "Image must be under 5MB" }, 400);
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const name = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = resolve(process.cwd(), "../frontend/public/uploads/banners");
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, name), bytes);

  return c.json({ url: `/uploads/banners/${name}` });
});

adminRoutes.get("/orders", async (c) => {
  const rows = await db.select().from(orders).orderBy(desc(orders.id)).limit(100);
  const result = [];
  for (const order of rows) {
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

    let customer: { id: string; name: string; email: string; image: string | null } | null =
      null;
    if (order.userId) {
      const [u] = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        })
        .from(user)
        .where(eq(user.id, order.userId))
        .limit(1);
      customer = u ?? null;
    }

    result.push({
      ...order,
      items: enrichedItems,
      payment: payment ?? null,
      customer,
    });
  }
  return c.json(result);
});

adminRoutes.get("/users", async (c) => {
  const rows = await db.select().from(user).orderBy(desc(user.createdAt));
  const result = [];
  for (const u of rows) {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, u.id));
    const orderCount = userOrders.length;
    const totalSpent = userOrders
      .filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + o.total, 0);
    result.push({
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      role: u.role,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      orderCount,
      totalSpent,
    });
  }
  return c.json(result);
});

adminRoutes.patch("/users/:id/role", async (c) => {
  const id = c.req.param("id");
  const body = z
    .object({ role: z.enum(["customer", "admin"]) })
    .safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: body.error.flatten() }, 400);
  }
  const [row] = await db
    .update(user)
    .set({ role: body.data.role, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  });
});
