import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { api } from "@/lib/api";
import { imageFor, placeholderImg } from "@/lib/images";
import { toast } from "sonner";

type OrderRow = {
  id: number;
  email: string | null;
  phone: string | null;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    imageKey?: string;
    image?: string;
  }[];
  payment: { razorpayOrderId: string; status: string } | null;
  customer: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
};

const STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
] as const;

function itemImage(item: OrderRow["items"][number]) {
  const key = item.imageKey || item.image || "";
  return key ? imageFor(key) : placeholderImg;
}

export function AdminOrdersPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => api<OrderRow[]>("/admin/orders"),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api(`/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast.success("Order status updated");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      api(`/admin/orders/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Order deleted");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Orders</h1>
      {isLoading ? (
        <AdminLoader label="Loading orders…" />
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {data.map((o) => (
            <div
              key={o.id}
              className="rounded-xl border border-border bg-white p-4 hover:border-brand-orange/40 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-semibold">Order #{o.id}</div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="border rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                    value={o.status}
                    disabled={setStatus.isPending}
                    onChange={(e) =>
                      setStatus.mutate({ id: o.id, status: e.target.value })
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    {!STATUSES.includes(o.status as (typeof STATUSES)[number]) && (
                      <option value={o.status}>{o.status}</option>
                    )}
                  </select>
                  <div className="font-display text-xl">
                    ₹{o.total.toLocaleString("en-IN")}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm(`Delete order #${o.id}?`)) {
                        remove.mutate(o.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                {o.customer?.image && (
                  <img
                    src={o.customer.image}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                  />
                )}
                <span>
                  {o.customer?.name || o.email || "Guest"}
                  {o.customer?.email
                    ? ` · ${o.customer.email}`
                    : o.email && !o.customer
                      ? ` · ${o.email}`
                      : ""}
                  {o.phone ? ` · +91 ${o.phone}` : ""}
                  {" · "}
                  {new Date(o.createdAt).toLocaleString("en-IN")}
                  {o.couponCode ? ` · Coupon ${o.couponCode}` : ""}
                </span>
              </div>

              <ul className="mt-4 space-y-3">
                {o.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-brand-black">
                      <img
                        src={itemImage(item)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-brand-black line-clamp-1">
                        {item.name}
                      </div>
                      <div className="text-muted-foreground">
                        Qty {item.quantity} · ₹
                        {item.price.toLocaleString("en-IN")} each
                      </div>
                    </div>
                    <div className="font-medium whitespace-nowrap">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </div>
                  </li>
                ))}
              </ul>

              {o.discount > 0 && (
                <p className="mt-2 text-xs text-green-700">
                  Discount −₹{o.discount.toLocaleString("en-IN")}
                </p>
              )}
              {o.payment && (
                <p className="mt-2 text-xs text-muted-foreground font-mono">
                  RZP {o.payment.razorpayOrderId} ({o.payment.status})
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
