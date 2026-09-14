import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, ImageIcon, Upload } from "lucide-react";
import { AdminTableSkeleton } from "@/components/admin/AdminLoader";
import { api, uploadProductImage, type ApiCategory, type ApiProduct } from "@/lib/api";
import { imageFor, productImageKeys } from "@/lib/images";
import { toast } from "sonner";

type AdminProduct = ApiProduct & {
  imageKey?: string;
  galleryImages?: string[];
  active: boolean;
  sortOrder?: number;
  featured?: boolean;
  bestSeller?: boolean;
  inStock?: boolean;
  stockQty?: number;
};

type ProductForm = {
  name: string;
  slug: string;
  price: number;
  originalPrice: number | "";
  category: string;
  imageKey: string;
  galleryImages: string[];
  description: string;
  specsText: string;
  active: boolean;
  featured: boolean;
  bestSeller: boolean;
  stockQty: number;
};

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  price: 0,
  originalPrice: "",
  category: "",
  imageKey: productImageKeys[0] ?? "",
  galleryImages: [],
  description: "",
  specsText: "",
  active: true,
  featured: false,
  bestSeller: false,
  stockQty: 10,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function SortableRow({
  product,
  onEdit,
  onRemove,
}: {
  product: AdminProduct;
  onEdit: (p: AdminProduct) => void;
  onRemove: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const key = product.imageKey || product.image;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-t border-border/80 transition-colors ${
        isDragging
          ? "bg-brand-yellow/20 shadow-lg relative z-10"
          : "hover:bg-brand-orange/5"
      }`}
    >
      <td className="p-3 w-10">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing rounded-md p-1.5 text-muted-foreground hover:bg-brand-gray hover:text-brand-black transition-colors"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="p-3">
        <div className="h-14 w-14 overflow-hidden rounded-lg border border-border bg-brand-black">
          <img
            src={imageFor(key)}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </td>
      <td className="p-3">
        <div className="font-semibold text-brand-black line-clamp-1">{product.name}</div>
        <div className="text-xs text-muted-foreground">{product.category}</div>
      </td>
      <td className="p-3 whitespace-nowrap font-medium">
        ₹{product.price.toLocaleString("en-IN")}
      </td>
      <td className="p-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            product.active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {product.active ? "Active" : "Hidden"}
        </span>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {Number(product.stockQty ?? 0) > 0
            ? `${product.stockQty} in stock`
            : "Out of stock"}
        </div>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="rounded-lg p-2 text-brand-orange hover:bg-brand-orange/10 transition-colors"
            title="Edit"
            aria-label="Edit product"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {product.active && (
            <button
              type="button"
              onClick={() => onRemove(product.id)}
              className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors"
              title="Remove"
              aria-label="Remove product"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function AdminProductsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => api<AdminProduct[]>("/admin/products"),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => api<ApiCategory[]>("/admin/categories"),
  });
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    setItems(data);
  }, [data]);

  const onUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setForm((f) => {
        if (!f.imageKey) return { ...f, imageKey: url };
        if (f.imageKey === url || f.galleryImages.includes(url)) return f;
        return { ...f, galleryImages: [...f.galleryImages, url] };
      });
      toast.success("Image added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const allFormImages = [form.imageKey, ...form.galleryImages].filter(
    (v, i, arr) => Boolean(v) && arr.indexOf(v) === i,
  );

  const removeImage = (key: string) => {
    setForm((f) => {
      if (f.imageKey === key) {
        const [nextCover, ...rest] = f.galleryImages;
        return {
          ...f,
          imageKey: nextCover ?? "",
          galleryImages: rest,
        };
      }
      return {
        ...f,
        galleryImages: f.galleryImages.filter((g) => g !== key),
      };
    });
  };

  const setAsCover = (key: string) => {
    setForm((f) => {
      if (f.imageKey === key) return f;
      const others = [f.imageKey, ...f.galleryImages].filter(
        (g) => g && g !== key,
      );
      return { ...f, imageKey: key, galleryImages: others };
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(() => items.map((p) => p.id), [items]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.imageKey) throw new Error("Add at least one product image");
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        price: Number(form.price),
        originalPrice: form.originalPrice === "" ? null : Number(form.originalPrice),
        category: form.category,
        imageKey: form.imageKey,
        galleryImages: form.galleryImages,
        description: form.description,
        specs: form.specsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        active: form.active,
        featured: form.featured,
        bestSeller: form.bestSeller,
        stockQty: Number(form.stockQty) || 0,
        inStock: Number(form.stockQty) > 0,
      };
      if (editingId) {
        return api(`/admin/products/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      return api("/admin/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success(editingId ? "Product updated" : "Product created");
      setForm(emptyForm);
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deactivate = useMutation({
    mutationFn: (id: number) =>
      api(`/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Product deactivated");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: (orderedIds: number[]) =>
      api("/admin/products/reorder", {
        method: "POST",
        body: JSON.stringify({ orderedIds }),
      }),
    onSuccess: () => {
      toast.success("Order saved");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setItems(data);
    },
  });

  const startEdit = (p: AdminProduct) => {
    const gallery =
      p.galleryImages ??
      (p.images || []).filter((img) => img !== (p.imageKey || p.image));
    setEditingId(p.id);
    setForm({
      name: p.name,
      slug: p.slug,
      price: p.price,
      originalPrice: p.originalPrice ?? "",
      category: p.category,
      imageKey: p.imageKey || p.image,
      galleryImages: gallery,
      description: p.description,
      specsText: (p.specs || []).join("\n"),
      active: p.active,
      featured: Boolean(p.featured),
      bestSeller: Boolean(p.bestSeller),
      stockQty: Number(p.stockQty ?? (p.inStock === false ? 0 : 10)),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    reorder.mutate(next.map((p) => p.id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Products</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drag rows to reorder storefront display. Images use bundled asset keys.
        </p>
      </div>

      <form
        className="rounded-xl border border-border bg-white p-5 grid gap-3 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <h2 className="md:col-span-2 font-semibold">
          {editingId ? `Edit #${editingId}` : "Add product"}
        </h2>
        <input
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              name: e.target.value,
              slug: f.slug || slugify(e.target.value),
            }))
          }
          required
        />
        <input
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          required
        />
        <input
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          type="number"
          placeholder="Price"
          value={form.price || ""}
          onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
          required
        />
        <input
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          type="number"
          placeholder="Original price"
          value={form.originalPrice}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              originalPrice: e.target.value === "" ? "" : Number(e.target.value),
            }))
          }
        />
        <select
          className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          required
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
          {form.category &&
            !categories.some((c) => c.name === form.category) && (
              <option value={form.category}>{form.category} (current)</option>
            )}
        </select>

        <div className="md:col-span-2 rounded-xl border border-border bg-brand-gray/30 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <ImageIcon className="h-4 w-4 text-brand-orange" />
            Product images
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Upload adds another image (does not replace). First image is the cover.
          </p>
          <div className="flex flex-wrap gap-3 mb-3">
            {allFormImages.map((key) => (
              <div
                key={key}
                className="relative h-24 w-24 overflow-hidden rounded-lg border border-border bg-brand-black"
              >
                <img
                  src={imageFor(key)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {key === form.imageKey && (
                  <span className="absolute left-1 top-1 rounded bg-brand-yellow px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand-black">
                    Cover
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/70 p-1">
                  {key !== form.imageKey && (
                    <button
                      type="button"
                      onClick={() => setAsCover(key)}
                      className="flex-1 text-[9px] font-semibold text-white hover:text-brand-yellow"
                    >
                      Cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(key)}
                    className="flex-1 text-[9px] font-semibold text-red-300 hover:text-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
              {uploading ? "Uploading…" : "Add image"}
            </button>
            <select
              className="border rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              value=""
              onChange={(e) => {
                const key = e.target.value;
                if (!key) return;
                setForm((f) => {
                  if (!f.imageKey) return { ...f, imageKey: key };
                  if (f.imageKey === key || f.galleryImages.includes(key)) return f;
                  return { ...f, galleryImages: [...f.galleryImages, key] };
                });
              }}
            >
              <option value="">Or add bundled asset…</option>
              {productImageKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          {!form.imageKey && (
            <p className="mt-2 text-xs text-red-600">Cover image is required.</p>
          )}
        </div>

        <textarea
          className="border rounded-lg px-3 py-2 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          placeholder="Description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <textarea
          className="border rounded-lg px-3 py-2 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          placeholder="Specs (one per line)"
          rows={4}
          value={form.specsText}
          onChange={(e) => setForm((f) => ({ ...f, specsText: e.target.value }))}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.bestSeller}
            onChange={(e) => setForm((f) => ({ ...f, bestSeller: e.target.checked }))}
          />
          Best Seller
        </label>
        <label className="flex items-center gap-2 text-sm">
          In stock qty
          <input
            type="number"
            min={0}
            className="w-24 border rounded-lg px-2 py-1"
            value={form.stockQty}
            onChange={(e) =>
              setForm((f) => ({ ...f, stockQty: Math.max(0, Number(e.target.value) || 0) }))
            }
          />
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="btn-yellow" disabled={save.isPending}>
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              className="rounded-lg border px-4 py-2 text-sm hover:bg-brand-gray transition-colors"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <AdminTableSkeleton rows={8} />
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <table className="w-full text-sm">
              <thead className="bg-brand-gray/50 text-left">
                <tr>
                  <th className="p-3 w-10" />
                  <th className="p-3">Image</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <tbody>
                  {items.map((p) => (
                    <SortableRow
                      key={p.id}
                      product={p}
                      onEdit={startEdit}
                      onRemove={(id) => deactivate.mutate(id)}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      )}
    </div>
  );
}
