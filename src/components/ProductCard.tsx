import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { imageFor } from "@/lib/images";
import { productWaMessage, waLink } from "@/lib/site";

type Product = {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  description: string;
  slug: string;
};

export function ProductCard({ product }: { product: Product }) {
  const href = waLink(productWaMessage(product.name, product.price));
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-xl hover:border-brand-yellow/60 transition-shadow"
    >
      <Link to={`/products/${product.slug}`} className="flex flex-col flex-1">
        <div className="relative aspect-square overflow-hidden bg-brand-black">
          <img
            src={imageFor(product.image)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width={800}
            height={800}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase tracking-wider text-brand-yellow drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {product.category}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <h3 className="font-display text-xl leading-tight text-brand-black group-hover:text-brand-orange transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
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

