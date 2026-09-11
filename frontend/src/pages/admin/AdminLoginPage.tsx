import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { GoogleIcon } from "@/components/GoogleIcon";
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
  const navigate = useNavigate();
  const from = (location.state as { from?: string } | null)?.from || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isPending) {
    return (
      <div className="min-h-screen bg-brand-gray">
        <AdminLoader fullPage label="Loading admin login…" />
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
      navigate(from, { replace: true });
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
          <div className="relative">
            <input
              className="w-full border rounded-lg px-3 py-2.5 pr-11 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-black"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
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
                Login
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
          onClick={() => signInWithGoogle(from)}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <Link
          to="/"
          className="mt-6 block text-center text-xs uppercase tracking-wider text-muted-foreground hover:text-brand-black transition-colors cursor-pointer"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
