import { FormEvent, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export function LoginPage() {
  const {
    user,
    isPending,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();
  const [params] = useSearchParams();
  const mode = params.get("mode") === "register" ? "register" : "login";

  const [name, setName] = useState("");
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

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "register") {
        if (!name.trim()) throw new Error("Name is required");
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        await signUpWithEmail(name, email, password);
        toast.success("Account created");
      } else {
        await signInWithEmail(email, password);
        toast.success("Logged in");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] grid place-items-center bg-brand-gray px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl text-brand-black mb-2">
            {mode === "register" ? "Create account" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "register"
              ? "Register with email or Google to checkout faster."
              : "Login with email & password or Google."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "register" && (
            <input
              className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          )}
          <input
            className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
            type="password"
            placeholder={mode === "register" ? "Password (min 8 characters)" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={8}
            required
          />
          <button
            type="submit"
            className="btn-yellow w-full justify-center"
            disabled={submitting}
          >
            {submitting
              ? "Please wait…"
              : mode === "register"
                ? "Register"
                : "Login"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-black px-4 py-2.5 text-sm font-bold text-brand-black hover:bg-brand-black hover:text-white transition-colors"
          onClick={() => signInWithGoogle("/")}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "register" ? (
            <>
              Already have an account?{" "}
              <Link to="/login" className="text-brand-orange font-semibold hover:underline">
                Login
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link
                to="/login?mode=register"
                className="text-brand-orange font-semibold hover:underline"
              >
                Register
              </Link>
            </>
          )}
        </p>
        <Link
          to="/"
          className="mt-6 block text-center text-xs uppercase tracking-wider text-muted-foreground hover:text-brand-black"
        >
          Back to store
        </Link>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
