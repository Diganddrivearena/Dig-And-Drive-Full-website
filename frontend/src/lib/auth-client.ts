import { createAuthClient } from "better-auth/react";

/** Use canonical site URL in production so OAuth state cookies match the Google callback host. */
function authBaseURL() {
  const configured = import.meta.env.VITE_BETTER_AUTH_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export const authClient = createAuthClient({
  baseURL: authBaseURL(),
});

export type AuthSession = typeof authClient.$Infer.Session;
