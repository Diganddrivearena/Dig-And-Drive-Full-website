import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./src/db/schema";

type ProductJson = {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  description: string;
  specs?: string[];
};

type CategoryJson = {
  id: string;
  name: string;
  description: string;
  image: string;
  featured: boolean;
};

const productsJson = JSON.parse(
  readFileSync(resolve("src/data/products.json"), "utf8"),
) as ProductJson[];
const categoriesJson = JSON.parse(
  readFileSync(resolve("src/data/categories.json"), "utf8"),
) as CategoryJson[];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const db = drizzle(neon(url), { schema });

  console.log("Seeding categories...");
  for (const cat of categoriesJson) {
    await db
      .insert(schema.categories)
      .values({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        imageKey: cat.image,
        featured: cat.featured,
      })
      .onConflictDoUpdate({
        target: schema.categories.id,
        set: {
          name: cat.name,
          description: cat.description,
          imageKey: cat.image,
          featured: cat.featured,
        },
      });
  }

  console.log("Seeding products...");
  for (const p of productsJson) {
    const existing = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.slug, p.slug))
      .limit(1);

    if (existing.length) {
      await db
        .update(schema.products)
        .set({
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice ?? null,
          category: p.category,
          imageKey: p.image,
          description: p.description,
          specs: p.specs ?? [],
          active: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.products.slug, p.slug));
    } else {
      await db.insert(schema.products).values({
        name: p.name,
        slug: p.slug,
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        category: p.category,
        imageKey: p.image,
        description: p.description,
        specs: p.specs ?? [],
        active: true,
      });
    }
  }

  const bannerCount = await db.select().from(schema.banners);
  if (bannerCount.length === 0) {
    console.log("Seeding default banners...");
    await db.insert(schema.banners).values([
      {
        title: "RC Adventure Starts Here",
        subtitle: "Premium machines for every age",
        imageUrl: "huina-1553",
        linkUrl: "/products",
        sortOrder: 0,
        active: true,
      },
      {
        title: "Same-Day Dispatch",
        subtitle: "PAN India delivery",
        imageUrl: "wltoys-4wd-car",
        linkUrl: "/#contact",
        sortOrder: 1,
        active: true,
      },
      {
        title: "Visit Dig & Drive Arena",
        subtitle: "Bachupally, Hyderabad",
        imageUrl: "mercedes-amg-gt3",
        linkUrl: "/#about",
        sortOrder: 2,
        active: true,
      },
    ]);
  }

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
