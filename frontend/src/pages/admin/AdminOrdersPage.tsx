import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { imageFor, placeholderImg } from "@/lib/images";

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

function itemImage(item: OrderRow["items"][number]) {
  const key = item.imageKey || item.image || "";
  return key ? imageFor(key) : placeholderImg;
}

export function AdminOrdersPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => api<OrderRow[]>("/admin/orders"),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Orders</h1>
      {isLoading ? (
        <p>Loading…</p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {data.map((o) => (
            <div
              key={o.id}
              className="rounded-xl border border-border bg-white p-4 hover:border-brand-orange/40 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">
                  Order #{o.id} ·{" "}
                  <span className="uppercase text-brand-orange">{o.status}</span>
                </div>
                <div className="font-display text-xl">
                  ₹{o.total.toLocaleString("en-IN")}
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
                  {o.customer?.email ? ` · ${o.customer.email}` : o.email && !o.customer ? ` · ${o.email}` : ""}
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
