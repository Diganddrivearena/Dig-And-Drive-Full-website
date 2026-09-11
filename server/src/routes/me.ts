import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { user as userTable } from "../db/schema";
import type { AppVariables } from "../app";
import { requireAuth } from "../middleware";
import { normalizeIndianPhone } from "../lib/fast2sms";
import { auth } from "../auth";

export const meRoutes = new Hono<{ Variables: AppVariables }>();

meRoutes.get("/", requireAuth, async (c) => {
  const sessionUser = c.get("user")!;
  const [row] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, sessionUser.id))
    .limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    image: row.image,
    role: row.role,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
  });
});

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(10).max(15).nullable().optional(),
  addressLine1: z.string().max(200).nullable().optional(),
  addressLine2: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  pincode: z.string().max(12).nullable().optional(),
});

meRoutes.patch("/", requireAuth, async (c) => {
  const sessionUser = c.get("user")!;
  const parsed = profileSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const data = parsed.data;

  let phone: string | null | undefined = undefined;
  if (data.phone !== undefined) {
    if (data.phone === null || data.phone === "") {
      phone = null;
    } else {
      phone = normalizeIndianPhone(data.phone);
      if (!phone) {
        return c.json({ error: "Enter a valid 10-digit mobile number" }, 400);
      }
      const [taken] = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.phone, phone))
        .limit(1);
      if (taken && taken.id !== sessionUser.id) {
        return c.json({ error: "This phone number is already in use" }, 400);
      }
    }
  }

  const [row] = await db
    .update(userTable)
    .set({
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(data.addressLine1 !== undefined
        ? { addressLine1: data.addressLine1 }
        : {}),
      ...(data.addressLine2 !== undefined
        ? { addressLine2: data.addressLine2 }
        : {}),
      ...(data.city !== undefined ? { city: data.city } : {}),
      ...(data.state !== undefined ? { state: data.state } : {}),
      ...(data.pincode !== undefined ? { pincode: data.pincode } : {}),
      updatedAt: new Date(),
    })
    .where(eq(userTable.id, sessionUser.id))
    .returning();

  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    image: row.image,
    role: row.role,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
  });
});

/** Sign in with email OR 10-digit phone + password */
meRoutes.post("/sign-in-identifier", async (c) => {
  const body = z
    .object({
      identifier: z.string().min(1),
      password: z.string().min(8),
    })
    .safeParse(await c.req.json());
  if (!body.success) {
    return c.json({ error: "Email/phone and password are required" }, 400);
  }

  const raw = body.data.identifier.trim();
  let email = raw.toLowerCase();

  if (!raw.includes("@")) {
    const phone = normalizeIndianPhone(raw);
    if (!phone) {
      return c.json({ error: "Enter a valid email or 10-digit phone" }, 400);
    }
    const [row] = await db
      .select({ email: userTable.email })
      .from(userTable)
      .where(eq(userTable.phone, phone))
      .limit(1);
    if (!row) {
      return c.json({ error: "Invalid phone or password" }, 401);
    }
    email = row.email;
  }

  const result = await auth.api.signInEmail({
    body: { email, password: body.data.password },
    headers: c.req.raw.headers,
    asResponse: true,
  });

  return result;
});
