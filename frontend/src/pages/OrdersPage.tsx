import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, type ApiOrder } from "@/lib/api";
import { imageFor, placeholderImg } from "@/lib/images";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-700",
  failed: "bg-red-100 text-red-800",
};

export function OrdersPage() {
  const { user, isPending } = useAuth();

  const { data = [], isLoading } = useQuery({
    queryKey: ["orders"],
    enabled: Boolean(user),
    queryFn: () => api<ApiOrder[]>("/orders"),
  });

  if (isPending || isLoading) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="bg-brand-gray/30 py-12 md:py-16">
      <div className="container-x max-w-3xl">
        <h1 className="font-display text-3xl md:text-4xl text-brand-black mb-2">
          My Orders
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Track status updates from the store.{" "}
          <Link to="/account" className="text-brand-orange font-semibold hover:underline">
            Account
          </Link>
        </p>

        {data.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-12 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No orders yet.</p>
            <Link to="/products" className="mt-4 inline-block text-brand-orange font-semibold hover:underline">
              Shop products →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((o) => (
              <article
                key={o.id}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-brand-black">
                      Order #{o.id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                      STATUS_STYLES[o.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {o.status}
                  </span>
                </div>

                <ul className="mt-4 space-y-3">
                  {o.items.map((item) => {
                    const key = item.imageKey || item.image || "";
                    return (
                      <li key={item.id} className="flex items-center gap-3 text-sm">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-brand-black">
                          <img
                            src={key ? imageFor(key) : placeholderImg}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium line-clamp-1">{item.name}</div>
                          <div className="text-muted-foreground">
                            Qty {item.quantity} · ₹
                            {item.price.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">
                    {o.couponCode ? `Coupon ${o.couponCode}` : "Total"}
                  </span>
                  <span className="font-display text-xl">
                    ₹{o.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
