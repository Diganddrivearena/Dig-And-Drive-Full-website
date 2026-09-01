import "dotenv/config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

/** Allow apex + www (and optional BETTER_AUTH_TRUSTED_ORIGINS) for Better Auth CSRF checks. */
function buildTrustedOrigins(): string[] {
  const origins = new Set<string>([
    "http://localhost:5173",
    "http://localhost:8787",
  ]);

  const addOrigin = (raw: string) => {
    const value = raw.trim().replace(/\/$/, "");
    if (!value) return;
    origins.add(value);
    try {
      const url = new URL(value.includes("://") ? value : `https://${value}`);
      origins.add(url.origin);
      const bareHost = url.hostname.replace(/^www\./, "");
      if (bareHost !== "localhost" && !bareHost.startsWith("127.")) {
        origins.add(`${url.protocol}//${bareHost}`);
        origins.add(`${url.protocol}//www.${bareHost}`);
      }
    } catch {
      // ignore malformed entries
    }
  };

  addOrigin(process.env.BETTER_AUTH_URL ?? "http://localhost:5173");
  for (const entry of (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "").split(",")) {
    addOrigin(entry);
  }

  return [...origins];
}

function productionCookieDomain(): string | undefined {
  try {
    const url = new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:5173");
    const host = url.hostname.replace(/^www\./, "");
    if (host === "localhost" || host.startsWith("127.")) return undefined;
    return host;
  } catch {
    return undefined;
  }
}

const cookieDomain = productionCookieDomain();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:5173",
  basePath: "/api/auth",
  trustedOrigins: buildTrustedOrigins(),
  advanced: {
    useSecureCookies: true,
    ...(cookieDomain
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: cookieDomain,
          },
        }
      : {}),
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {},
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = (user.email ?? "").toLowerCase();
          const role = adminEmails().has(email) ? "admin" : "customer";
          return { data: { ...user, role } };
        },
      },
    },
  },
});

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
};
