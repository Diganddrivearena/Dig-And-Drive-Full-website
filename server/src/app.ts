import { Hono } from "hono";
import { cors } from "hono/cors";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { user as userTable } from "./db/schema";
import { productsRoutes } from "./routes/products";
import { bannersRoutes } from "./routes/banners";
import { couponsRoutes } from "./routes/coupons";
import { adminRoutes } from "./routes/admin";
import { checkoutRoutes } from "./routes/checkout";

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export type AppVariables = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string | null;
  } | null;
  session: { id: string; userId: string } | null;
};

export const app = new Hono<{ Variables: AppVariables }>().basePath("/api");

app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  let user = session?.user ?? null;

  if (
    user?.email &&
    adminEmails().has(user.email.toLowerCase()) &&
    user.role !== "admin"
  ) {
    await db
      .update(userTable)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(userTable.id, user.id));
    user = { ...user, role: "admin" };
  }

  c.set("user", user);
  c.set("session", session?.session ?? null);
  await next();
});

app.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

app.get("/health", (c) => c.json({ ok: true }));

app.route("/products", productsRoutes);
app.route("/banners", bannersRoutes);
app.route("/coupons", couponsRoutes);
app.route("/admin", adminRoutes);
app.route("/checkout", checkoutRoutes);

export default app;
