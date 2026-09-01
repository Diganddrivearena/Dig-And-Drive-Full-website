import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { LayoutDashboard, Package, Ticket, Image, LogOut, ShoppingBag, Users } from "lucide-react";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/banners", label: "Banners", icon: Image },
];

export function AdminLayout() {
  const { user, isAdmin, isPending, signOut } = useAuth();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="min-h-screen bg-brand-gray">
        <AdminLoader fullPage label="Checking admin access…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-brand-gray p-6 text-center">
        <div>
          <h1 className="font-display text-3xl mb-2">Access denied</h1>
          <p className="text-muted-foreground mb-4">
            {user.email} is not an admin. Add this email to ADMIN_EMAILS.
          </p>
          <button className="btn-yellow" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray flex">
      <aside className="w-56 shrink-0 bg-brand-black text-white p-4 flex flex-col">
        <Link to="/" className="font-display text-lg mb-6">
          DIG &amp; DRIVE <span className="text-brand-orange">Admin</span>
        </Link>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  active ? "bg-brand-orange text-white" : "text-white/70 hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
