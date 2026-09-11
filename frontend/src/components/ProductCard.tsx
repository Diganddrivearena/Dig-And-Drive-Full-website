import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { imageFor } from "@/lib/images";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Product = {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  description: string;
  slug: string;
  inStock?: boolean;
};

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const inStock = product.inStock !== false;

  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist"],
    enabled: Boolean(user),
    queryFn: () => api<{ productId: number }[]>("/wishlist"),
  });

  const wished = wishlist.some((r) => r.productId === product.id);

  const toggleWish = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("login");
      if (wished) {
        await api(`/wishlist/${product.id}`, { method: "DELETE" });
      } else {
        await api("/wishlist", {
          method: "POST",
          body: JSON.stringify({ productId: product.id }),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(wished ? "Removed from wishlist" : "Added to wishlist");
    },
    onError: (e: Error) => {
      if (e.message === "login" || !user) {
        toast.error("Login to save wishlist items");
        return;
      }
      toast.error(e.message);
    },
  });

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-xl hover:border-brand-yellow/60 transition-shadow"
    >
      <div className="relative">
        <Link to={`/products/${product.slug}`} className="block">
          <div className="relative aspect-square overflow-hidden bg-brand-black">
            <img
              src={imageFor(product.image)}
              alt={product.name}
              loading="lazy"
              decoding="async"
              width={800}
              height={800}
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                !inStock ? "opacity-70" : ""
              }`}
            />
            <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase tracking-wider text-brand-yellow drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {product.category}
            </span>
            {!inStock && (
              <span className="absolute bottom-3 left-3 rounded bg-brand-black/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Out of stock
              </span>
            )}
          </div>
        </Link>
        <button
          type="button"
          onClick={() => toggleWish.mutate()}
          className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-brand-black shadow hover:text-brand-orange transition-colors"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-4 w-4 ${wished ? "fill-brand-orange text-brand-orange" : ""}`}
          />
        </button>
      </div>
      <Link to={`/products/${product.slug}`} className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-3 p-4">
          <h3 className="font-display text-xl leading-tight text-brand-black group-hover:text-brand-orange transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
          <div className="mt-auto pt-2 flex items-baseline gap-2">
            <span className="text-2xl font-display text-brand-black">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
