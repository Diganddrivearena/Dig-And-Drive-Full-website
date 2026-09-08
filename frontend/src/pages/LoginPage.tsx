import { FormEvent, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/GoogleIcon";
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
  const [phone, setPhone] = useState("");
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
        const digits = phone.replace(/\D/g, "");
        if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
          throw new Error("Enter a valid 10-digit mobile number for SMS");
        }
        await signUpWithEmail(name, email, password, digits);
        toast.success("Account created. A welcome SMS will be sent to your mobile.");
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
          {mode === "register" && (
            <input
              className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile (for SMS)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
            />
          )}
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
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-black/20 border-t-brand-black" />
                Please wait…
              </span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                {mode === "register" ? "Register" : "Login"}
              </>
            )}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          className="btn-dark w-full text-sm normal-case tracking-normal py-2.5"
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
          className="mt-6 block text-center text-xs uppercase tracking-wider text-muted-foreground hover:text-brand-black transition-colors cursor-pointer"
        >
          Back to store
        </Link>
      </div>
    </div>
  );
}
