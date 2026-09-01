import { FormEvent, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export function AdminLoginPage() {
  const {
    user,
    isAdmin,
    isPending,
    signInWithGoogle,
    signInWithEmail,
  } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isPending) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  if (user && isAdmin) {
    return <Navigate to={from} replace />;
  }

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-3xl mb-2">Not an admin</h1>
          <p className="text-muted-foreground mb-4">
            Signed in as {user.email}. Add this email to ADMIN_EMAILS, or promote
            the account from Users in admin.
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      toast.success("Logged in");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-brand-gray p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl text-brand-black mb-2">Admin login</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with email & password or Google. Only admin accounts can manage the store.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <button type="submit" className="btn-yellow w-full justify-center" disabled={submitting}>
            {submitting ? "Please wait…" : "Login"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          className="w-full rounded-lg border-2 border-brand-black px-4 py-2.5 text-sm font-bold hover:bg-brand-black hover:text-white transition-colors"
          onClick={() => signInWithGoogle("/admin")}
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
