import { Link, Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api, type ApiProduct } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

type WishlistRow = {
  id: number;
  productId: number;
  createdAt: string;
  product: ApiProduct & { description?: string };
};

export function WishlistPage() {
  const { user, isPending } = useAuth();
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["wishlist"],
    enabled: Boolean(user),
    queryFn: () => api<WishlistRow[]>("/wishlist"),
  });

  const remove = useMutation({
    mutationFn: (productId: number) =>
      api(`/wishlist/${productId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Removed from wishlist");
      qc.invalidateQueries({ queryKey: ["wishlist"] });
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

  return (
    <div className="bg-brand-gray/30 py-12 md:py-16">
      <div className="container-x">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-brand-black">
              Wishlist
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Products you saved for later.
            </p>
          </div>
          <Link to="/products" className="text-sm font-bold text-brand-orange hover:underline">
            Browse products →
          </Link>
        </div>

        {data.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-12 text-center text-muted-foreground">
            <Heart className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Your wishlist is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((row) => (
              <div key={row.id} className="relative">
                <ProductCard
                  product={{
                    id: row.product.id,
                    name: row.product.name,
                    price: row.product.price,
                    originalPrice: row.product.originalPrice,
                    category: row.product.category,
                    image: row.product.image,
                    description: row.product.description || "",
                    slug: row.product.slug,
                    inStock: row.product.inStock,
                  }}
                />
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-muted-foreground hover:text-brand-orange"
                  onClick={() => remove.mutate(row.productId)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
