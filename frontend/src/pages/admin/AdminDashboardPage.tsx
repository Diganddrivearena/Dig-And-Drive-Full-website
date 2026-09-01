import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminDashboardSkeleton } from "@/components/admin/AdminLoader";
import { api } from "@/lib/api";

export function AdminDashboardPage() {
  const products = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => api<unknown[]>("/admin/products"),
  });
  const coupons = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => api<unknown[]>("/admin/coupons"),
  });
  const banners = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: () => api<unknown[]>("/admin/banners"),
  });
  const orders = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => api<unknown[]>("/admin/orders"),
  });
  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api<unknown[]>("/admin/users"),
  });

  const isLoading =
    products.isLoading ||
    coupons.isLoading ||
    banners.isLoading ||
    orders.isLoading ||
    users.isLoading;

  const cards = [
    { label: "Products", count: products.data?.length ?? "—", to: "/admin/products" },
    { label: "Orders", count: orders.data?.length ?? "—", to: "/admin/orders" },
    { label: "Users", count: users.data?.length ?? "—", to: "/admin/users" },
    { label: "Coupons", count: coupons.data?.length ?? "—", to: "/admin/coupons" },
    { label: "Banners", count: banners.data?.length ?? "—", to: "/admin/banners" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-brand-black mb-6">Overview</h1>
      {isLoading ? (
        <AdminDashboardSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="rounded-xl border border-border bg-white p-5 hover:border-brand-orange transition-colors"
            >
              <div className="text-sm text-muted-foreground uppercase tracking-wide">{c.label}</div>
              <div className="font-display text-4xl mt-2">{c.count}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
