import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AdminTableSkeleton } from "@/components/admin/AdminLoader";
import { api, type ApiCoupon } from "@/lib/api";
import { toast } from "sonner";

type Form = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxUses: number | "";
  active: boolean;
};

const empty: Form = {
  code: "",
  type: "percent",
  value: 10,
  minOrder: 0,
  maxUses: "",
  active: true,
};

export function AdminCouponsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => api<ApiCoupon[]>("/admin/coupons"),
  });
  const [form, setForm] = useState<Form>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder),
        maxUses: form.maxUses === "" ? null : Number(form.maxUses),
        active: form.active,
      };
      if (editingId) {
        return api(`/admin/coupons/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      return api("/admin/coupons", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success(editingId ? "Coupon updated" : "Coupon created");
      setForm(empty);
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api(`/admin/coupons/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Coupon deleted");
      qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Coupons</h1>

      <form
        className="rounded-xl border border-border bg-white p-5 grid gap-3 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <input
          className="border rounded-lg px-3 py-2 uppercase"
          placeholder="CODE"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
          required
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={form.type}
          onChange={(e) =>
            setForm((f) => ({ ...f, type: e.target.value as "percent" | "fixed" }))
          }
        >
          <option value="percent">Percent</option>
          <option value="fixed">Fixed ₹</option>
        </select>
        <input
          className="border rounded-lg px-3 py-2"
          type="number"
          placeholder="Value"
          value={form.value}
          onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
          required
        />
        <input
          className="border rounded-lg px-3 py-2"
          type="number"
          placeholder="Min order"
          value={form.minOrder}
          onChange={(e) => setForm((f) => ({ ...f, minOrder: Number(e.target.value) }))}
        />
        <input
          className="border rounded-lg px-3 py-2"
          type="number"
          placeholder="Max uses (optional)"
          value={form.maxUses}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              maxUses: e.target.value === "" ? "" : Number(e.target.value),
            }))
          }
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          Active
        </label>
        <div className="md:col-span-3 flex gap-2">
          <button type="submit" className="btn-yellow" disabled={save.isPending}>
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              className="rounded-lg border px-4 py-2 text-sm"
              onClick={() => {
                setEditingId(null);
                setForm(empty);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <AdminTableSkeleton rows={5} />
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-gray/50 text-left">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Type</th>
                <th className="p-3">Value</th>
                <th className="p-3">Used</th>
                <th className="p-3">Active</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="border-t hover:bg-brand-orange/5 transition-colors">
                  <td className="p-3 font-mono font-semibold">{c.code}</td>
                  <td className="p-3">{c.type}</td>
                  <td className="p-3">{c.value}</td>
                  <td className="p-3">
                    {c.usedCount}
                    {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        c.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-brand-orange hover:bg-brand-orange/10 transition-colors"
                        title="Edit"
                        aria-label="Edit coupon"
                        onClick={() => {
                          setEditingId(c.id);
                          setForm({
                            code: c.code,
                            type: c.type as "percent" | "fixed",
                            value: Number(c.value),
                            minOrder: c.minOrder,
                            maxUses: c.maxUses ?? "",
                            active: c.active,
                          });
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove"
                        aria-label="Remove coupon"
                        onClick={() => remove.mutate(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
