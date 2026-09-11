import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Upload, ImageIcon } from "lucide-react";
import { AdminTableSkeleton } from "@/components/admin/AdminLoader";
import {
  api,
  uploadCategoryImage,
  type ApiCategory,
} from "@/lib/api";
import { imageFor } from "@/lib/images";
import { toast } from "sonner";

type Form = {
  id: string;
  name: string;
  description: string;
  imageKey: string;
  featured: boolean;
};

const empty: Form = {
  id: "",
  name: "",
  description: "",
  imageKey: "",
  featured: true,
};

export function AdminCategoriesPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Form>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => api<ApiCategory[]>("/admin/categories"),
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        description: form.description,
        imageKey: form.imageKey,
        featured: form.featured,
        ...(editingId ? {} : form.id ? { id: form.id } : {}),
      };
      if (editingId) {
        return api(`/admin/categories/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      return api("/admin/categories", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success(editingId ? "Category updated" : "Category created");
      setForm(empty);
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      api(`/admin/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Category deleted");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCategoryImage(file);
      setForm((f) => ({ ...f, imageKey: url }));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const startEdit = (c: ApiCategory) => {
    setEditingId(c.id);
    setForm({
      id: c.id,
      name: c.name,
      description: c.description || "",
      imageKey: c.imageKey,
      featured: c.featured,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Categories</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create and edit store categories. Upload images or use an existing asset key.
        </p>
      </div>

      <form
        className="rounded-xl border border-border bg-white p-5 grid gap-3 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.imageKey) {
            toast.error("Image is required");
            return;
          }
          save.mutate();
        }}
      >
        <h2 className="md:col-span-2 font-semibold">
          {editingId ? `Edit ${editingId}` : "Add category"}
        </h2>
        {!editingId && (
          <input
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
            placeholder="Id (optional slug)"
            value={form.id}
            onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
          />
        )}
        <input
          className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 ${
            editingId ? "md:col-span-2" : ""
          }`}
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <textarea
          className="border rounded-lg px-3 py-2 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          placeholder="Description"
          rows={2}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />

        <div className="md:col-span-2 rounded-xl border border-border bg-brand-gray/30 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <ImageIcon className="h-4 w-4 text-brand-orange" />
            Category image
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-brand-black">
              {form.imageKey ? (
                <img
                  src={imageFor(form.imageKey)}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-white/40 text-xs">
                  No image
                </div>
              )}
            </div>
            <div className="flex-1 w-full space-y-2">
              <input
                className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                placeholder="Image key or /uploads/categories/…"
                value={form.imageKey}
                onChange={(e) =>
                  setForm((f) => ({ ...f, imageKey: e.target.value }))
                }
                required
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => onUpload(e.target.files?.[0])}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold hover:border-brand-orange hover:bg-brand-orange/5 transition-colors disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload image"}
              </button>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) =>
              setForm((f) => ({ ...f, featured: e.target.checked }))
            }
          />
          Featured
        </label>

        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="btn-yellow" disabled={save.isPending}>
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              className="rounded-lg border px-4 py-2 text-sm hover:bg-brand-gray"
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
                <th className="p-3">Image</th>
                <th className="p-3">Category</th>
                <th className="p-3">Featured</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="border-t hover:bg-brand-orange/5">
                  <td className="p-3">
                    <div className="h-12 w-12 overflow-hidden rounded-lg border bg-brand-black">
                      <img
                        src={imageFor(c.imageKey)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.id}</div>
                  </td>
                  <td className="p-3">{c.featured ? "Yes" : "No"}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="p-1.5 rounded hover:bg-brand-gray"
                        onClick={() => startEdit(c)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded hover:bg-red-50 text-red-600"
                        onClick={() => {
                          if (confirm(`Delete category “${c.name}”?`)) {
                            remove.mutate(c.id);
                          }
                        }}
                        aria-label="Delete"
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
