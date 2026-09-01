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
import {
  GripVertical,
  Pencil,
  Trash2,
  ImageIcon,
  Upload,
} from "lucide-react";
import { AdminCardGridSkeleton } from "@/components/admin/AdminLoader";
import { api, uploadBannerImage, type ApiBannerAdmin } from "@/lib/api";
import { imageFor, productImages, placeholderImg } from "@/lib/images";
import { toast } from "sonner";

type Form = {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  active: boolean;
};

const empty: Form = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "/products",
  sortOrder: 0,
  active: true,
};

const galleryKeys = Object.keys(productImages);

function resolveBannerSrc(value: string) {
  if (!value) return placeholderImg;
  if (
    value.startsWith("http") ||
    value.startsWith("/") ||
    value.startsWith("data:")
  ) {
    return value;
  }
  return imageFor(value);
}

function SortableBannerCard({
  banner,
  onEdit,
  onRemove,
}: {
  banner: ApiBannerAdmin;
  onEdit: (b: ApiBannerAdmin) => void;
  onRemove: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-border bg-white overflow-hidden transition-colors ${
        isDragging
          ? "shadow-lg ring-2 ring-brand-orange/40 z-10"
          : "hover:border-brand-orange/50"
      }`}
    >
      <div className="relative aspect-[16/9] bg-brand-gray">
        <img
          src={resolveBannerSrc(banner.imageUrl)}
          alt={banner.title}
          className="h-full w-full object-cover"
        />
        {!banner.imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-black/40 text-white text-xs font-semibold uppercase tracking-wider">
            No image — click edit to add
          </div>
        )}
        <button
          type="button"
          className="absolute top-2 left-2 cursor-grab active:cursor-grabbing rounded-md bg-white/90 p-1.5 text-muted-foreground hover:bg-white hover:text-brand-black transition-colors"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span
          className={`absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            banner.active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {banner.active ? "Active" : "Hidden"}
        </span>
      </div>
      <div className="p-4">
        <div className="font-display text-xl text-brand-black">{banner.title}</div>
        <p className="text-sm text-muted-foreground mt-1">{banner.subtitle || "—"}</p>
        <p className="text-xs text-muted-foreground mt-2 truncate">
          Link: {banner.linkUrl || "—"}
        </p>
        <div className="mt-3 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(banner)}
            className="rounded-lg p-2 text-brand-orange hover:bg-brand-orange/10 transition-colors"
            title="Edit"
            aria-label="Edit banner"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(banner.id)}
            className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors"
            title="Remove"
            aria-label="Remove banner"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminBannersPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: () => api<ApiBannerAdmin[]>("/admin/banners"),
  });
  const [items, setItems] = useState<ApiBannerAdmin[]>([]);
  const [form, setForm] = useState<Form>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setItems(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(() => items.map((b) => b.id), [items]);

  const save = useMutation({
    mutationFn: async () => {
      if (editingId) {
        return api(`/admin/banners/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
      }
      return api("/admin/banners", {
        method: "POST",
        body: JSON.stringify(form),
      });
    },
    onSuccess: () => {
      toast.success(editingId ? "Banner updated" : "Banner created");
      setForm(empty);
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api(`/admin/banners/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Banner deleted");
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: (orderedIds: number[]) =>
      api("/admin/banners/reorder", {
        method: "POST",
        body: JSON.stringify({ orderedIds }),
      }),
    onSuccess: () => {
      toast.success("Order saved");
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setItems(data);
    },
  });

  const startEdit = (b: ApiBannerAdmin) => {
    setEditingId(b.id);
    setForm({
      title: b.title,
      subtitle: b.subtitle,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
      sortOrder: b.sortOrder,
      active: b.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((b) => b.id === active.id);
    const newIndex = items.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    reorder.mutate(next.map((b) => b.id));
  };

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadBannerImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Banners</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a new image, paste a URL, or pick a store asset. Drag cards to reorder.
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
          {editingId ? `Edit banner #${editingId}` : "Add banner"}
        </h2>
        <input
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <input
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          placeholder="Subtitle"
          value={form.subtitle}
          onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
        />
        <input
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          placeholder="Link URL"
          value={form.linkUrl}
          onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
        />
        <input
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          type="number"
          placeholder="Sort order"
          value={form.sortOrder}
          onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
        />

        <div className="md:col-span-2 rounded-xl border border-border bg-brand-gray/30 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <ImageIcon className="h-4 w-4 text-brand-orange" />
            Banner image
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="h-28 w-44 shrink-0 overflow-hidden rounded-lg border border-border bg-brand-black">
              <img
                src={resolveBannerSrc(form.imageUrl)}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 w-full space-y-3">
              <div className="flex flex-wrap gap-2">
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
                  {uploading ? "Uploading…" : "Upload new image"}
                </button>
              </div>
              <input
                className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                placeholder="Or paste image URL / asset key"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              />
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                {galleryKeys.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: key }))}
                    className={`h-12 w-12 overflow-hidden rounded-md border-2 transition-all hover:scale-105 ${
                      form.imageUrl === key
                        ? "border-brand-orange ring-2 ring-brand-orange/30"
                        : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                    title={key}
                  >
                    <img
                      src={imageFor(key)}
                      alt={key}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          Active
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
                setForm(empty);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <AdminCardGridSkeleton cards={4} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((b) => (
                <SortableBannerCard
                  key={b.id}
                  banner={b}
                  onEdit={startEdit}
                  onRemove={(id) => remove.mutate(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
