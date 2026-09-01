import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
};

export function AdminUsersPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api<AdminUser[]>("/admin/users"),
  });

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "customer" | "admin" }) =>
      api(`/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customers and admins who signed in to the store.
        </p>
      </div>

      {isLoading ? (
        <p>Loading…</p>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-10 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No users yet. They appear here after Google login.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-gray/50 text-left">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Spent</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-t hover:bg-brand-orange/5 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-brand-gray border border-border shrink-0">
                        {u.image ? (
                          <img
                            src={u.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full grid place-items-center text-xs font-bold text-muted-foreground">
                            {(u.name || u.email || "?").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-brand-black truncate">
                          {u.name || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.role === "admin"
                          ? "bg-brand-orange/15 text-brand-orange"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">{u.orderCount}</td>
                  <td className="p-3 font-medium">
                    ₹{u.totalSpent.toLocaleString("en-IN")}
                  </td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                  <td className="p-3">
                    {u.role === "admin" ? (
                      <button
                        type="button"
                        className="text-xs font-semibold text-muted-foreground hover:text-brand-black"
                        onClick={() =>
                          setRole.mutate({ id: u.id, role: "customer" })
                        }
                      >
                        Make customer
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-xs font-semibold text-brand-orange hover:underline"
                        onClick={() => setRole.mutate({ id: u.id, role: "admin" })}
                      >
                        Make admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
