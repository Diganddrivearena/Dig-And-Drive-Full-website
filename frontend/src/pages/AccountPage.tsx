import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ApiError, api, type ApiProfile } from "@/lib/api";

type ProfileForm = {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
};

function toForm(profile: ApiProfile): ProfileForm {
  return {
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    addressLine1: profile.addressLine1 ?? "",
    addressLine2: profile.addressLine2 ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    pincode: profile.pincode ?? "",
  };
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function AccountPage() {
  const { user, isPending } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [dirty, setDirty] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["me"],
    enabled: Boolean(user),
    queryFn: () => api<ApiProfile>("/me"),
  });

  // Only hydrate from server when the user hasn't started editing.
  // Previously every refetch reset the form and wiped typed address fields.
  useEffect(() => {
    if (!data || dirty) return;
    setForm(toForm(data));
  }, [data, dirty]);

  const save = useMutation({
    mutationFn: async (values: ProfileForm) => {
      if (!values.name.trim()) throw new Error("Name is required");

      const phoneDigits = values.phone.replace(/\D/g, "");
      if (
        phoneDigits &&
        (phoneDigits.length !== 10 || !/^[6-9]/.test(phoneDigits))
      ) {
        throw new Error("Enter a valid 10-digit mobile number");
      }

      return api<ApiProfile>("/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: values.name.trim(),
          phone: phoneDigits || null,
          addressLine1: emptyToNull(values.addressLine1),
          addressLine2: emptyToNull(values.addressLine2),
          city: emptyToNull(values.city),
          state: emptyToNull(values.state),
          pincode: emptyToNull(values.pincode),
        }),
      });
    },
    onSuccess: (profile) => {
      const next = toForm(profile);
      setForm(next);
      setDirty(false);
      qc.setQueryData(["me"], profile);
      toast.success("Profile saved");
    },
    onError: (e: Error) => {
      if (e instanceof ApiError && e.body && typeof e.body === "object") {
        const body = e.body as { error?: unknown };
        if (typeof body.error === "string") {
          toast.error(body.error);
          return;
        }
      }
      toast.error(e.message || "Could not save profile");
    },
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

  if (isError) {
    return (
      <div className="container-x py-16 text-center">
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "Could not load profile."}
        </p>
        <button
          type="button"
          className="btn-yellow"
          onClick={() => void refetch()}
        >
          Try again
        </button>
      </div>
    );
  }

  const values = form ?? (data ? toForm(data) : null);
  if (!values) {
    return (
      <div className="container-x py-16 text-center text-muted-foreground">
        Could not load profile.
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(values);
  };

  const updateField = (key: keyof ProfileForm, value: string) => {
    setDirty(true);
    setForm((prev) => ({ ...(prev ?? values), [key]: value }));
  };

  const field = (
    key: keyof ProfileForm,
    label: string,
    opts?: { type?: string; required?: boolean },
  ) => (
    <label className="block text-sm">
      <span className="font-semibold text-brand-black">{label}</span>
      <input
        className="mt-1 w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
        type={opts?.type || "text"}
        required={opts?.required}
        value={values[key]}
        onChange={(e) => updateField(key, e.target.value)}
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
          <Link
            to="/orders"
            className="text-brand-orange font-semibold hover:underline"
          >
            View orders
          </Link>{" "}
          ·{" "}
          <Link
            to="/wishlist"
            className="text-brand-orange font-semibold hover:underline"
          >
            Wishlist
          </Link>
        </p>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-border bg-white p-6 md:p-8 space-y-4 shadow-sm"
        >
          <p className="text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-semibold text-brand-black">{user.email}</span>
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
          {dirty && !save.isPending && (
            <p className="text-xs text-muted-foreground">
              You have unsaved changes.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
