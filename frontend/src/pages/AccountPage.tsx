import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api, type ApiProfile } from "@/lib/api";

export function AccountPage() {
  const { user, isPending, refreshSession } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    enabled: Boolean(user),
    queryFn: () => api<ApiProfile>("/me"),
  });

  const [form, setForm] = useState<Partial<ApiProfile> | null>(null);
  const values = form ?? data ?? null;

  const save = useMutation({
    mutationFn: () =>
      api<ApiProfile>("/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: values?.name,
          phone: values?.phone || null,
          addressLine1: values?.addressLine1 || null,
          addressLine2: values?.addressLine2 || null,
          city: values?.city || null,
          state: values?.state || null,
          pincode: values?.pincode || null,
        }),
      }),
    onSuccess: async (profile) => {
      toast.success("Profile saved");
      setForm(null);
      qc.setQueryData(["me"], profile);
      await refreshSession();
    },
    onError: (e: Error) => toast.error(e.message),
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

  if (!values) {
    return (
      <div className="container-x py-16 text-center text-muted-foreground">
        Could not load profile.
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  const field = (
    key: keyof ApiProfile,
    label: string,
    opts?: { type?: string; required?: boolean },
  ) => (
    <label className="block text-sm">
      <span className="font-semibold text-brand-black">{label}</span>
      <input
        className="mt-1 w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
        type={opts?.type || "text"}
        required={opts?.required}
        value={(values[key] as string | null) ?? ""}
        onChange={(e) =>
          setForm({
            ...values,
            [key]: e.target.value,
          })
        }
      />
    </label>
  );

  return (
    <div className="bg-brand-gray/30 py-12 md:py-16">
      <div className="container-x max-w-2xl">
        <h1 className="font-display text-3xl md:text-4xl text-brand-black mb-2">
          My Account
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Update your profile and delivery address.{" "}
          <Link to="/orders" className="text-brand-orange font-semibold hover:underline">
            View orders
          </Link>{" "}
          ·{" "}
          <Link to="/wishlist" className="text-brand-orange font-semibold hover:underline">
            Wishlist
          </Link>
        </p>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-border bg-white p-6 md:p-8 space-y-4 shadow-sm"
        >
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-semibold text-brand-black">{user.email}</span>
          </p>
          {field("name", "Full name", { required: true })}
          {field("phone", "Phone (10 digits)", { type: "tel" })}
          {field("addressLine1", "Address line 1")}
          {field("addressLine2", "Address line 2")}
          <div className="grid sm:grid-cols-2 gap-4">
            {field("city", "City")}
            {field("state", "State")}
          </div>
          {field("pincode", "PIN code")}
          <button
            type="submit"
            className="btn-yellow"
            disabled={save.isPending}
          >
            {save.isPending ? "Saving…" : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
