import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
  phone?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isPending: boolean;
  isAdmin: boolean;
  signInWithGoogle: (callbackURL?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithIdentifier: (identifier: string, password: string) => Promise<void>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string,
    phone: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function authErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object") {
    const e = err as { message?: string; error?: { message?: string } };
    return e.error?.message || e.message || fallback;
  }
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: sessionPending, refetch } =
    authClient.useSession();

  const value = useMemo<AuthContextValue>(() => {
    const user = (session?.user as AuthUser | undefined) ?? null;

    return {
      user,
      isPending: sessionPending,
      isAdmin: user?.role === "admin",
      signInWithGoogle: async (callbackURL = "/") => {
        await authClient.signIn.social({
          provider: "google",
          callbackURL,
        });
      },
      signInWithEmail: async (email, password) => {
        const { error } = await authClient.signIn.email({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) {
          throw new Error(
            authErrorMessage(error, "Invalid email or password"),
          );
        }
      },
      signInWithIdentifier: async (identifier, password) => {
        const raw = identifier.trim();
        if (raw.includes("@")) {
          const { error } = await authClient.signIn.email({
            email: raw.toLowerCase(),
            password,
          });
          if (error) {
            throw new Error(
              authErrorMessage(error, "Invalid email or password"),
            );
          }
          return;
        }

        try {
          await api("/me/sign-in-identifier", {
            method: "POST",
            body: JSON.stringify({ identifier: raw, password }),
          });
          await refetch();
        } catch (err) {
          throw new Error(
            err instanceof Error ? err.message : "Invalid phone or password",
          );
        }
      },
      signUpWithEmail: async (name, email, password, phone) => {
        const { error } = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.replace(/\D/g, ""),
        } as { name: string; email: string; password: string; phone: string });
        if (error) {
          throw new Error(authErrorMessage(error, "Could not create account"));
        }
      },
      signOut: async () => {
        await authClient.signOut();
      },
      refreshSession: async () => {
        await refetch();
      },
    };
  }, [session, sessionPending, refetch]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
