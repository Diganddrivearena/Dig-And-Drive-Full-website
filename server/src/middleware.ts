import type { Context, Next } from "hono";
import type { AppVariables } from "../app";

type AppContext = Context<{ Variables: AppVariables }>;

export async function requireAuth(c: AppContext, next: Next) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
}

export async function requireAdmin(c: AppContext, next: Next) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
}
