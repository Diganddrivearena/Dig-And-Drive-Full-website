import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingBag,
  Heart,
  Star,
} from "lucide-react";
import { imageFor, getExtraImages } from "@/lib/images";
import { productWaMessage, waLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { ProductCard } from "@/components/ProductCard";
import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useProduct, useProducts } from "@/hooks/useCatalog";
import { api, type ApiReview } from "@/lib/api";

export function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug);
  const { data: allProducts = [] } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [zoomState, setZoomState] = useState({ show: false, x: 0, y: 0 });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    setCurrentImageIdx(0);
  }, [slug]);

  const { data: reviewData } = useQuery({
    queryKey: ["reviews", slug],
    enabled: Boolean(slug),
    queryFn: () =>
      api<{
        average: number;
        count: number;
        reviews: ApiReview[];
      }>(`/reviews/product/${slug}`),
  });

  const { data: wishlistRows = [] } = useQuery({
    queryKey: ["wishlist"],
    enabled: Boolean(user),
    queryFn: () => api<{ productId: number }[]>("/wishlist"),
  });

  const wished = product
    ? wishlistRows.some((r) => r.productId === product.id)
    : false;
  const inStock = product?.inStock !== false;

  const toggleWish = useMutation({
    mutationFn: async () => {
      if (!user || !product) throw new Error("login");
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
    onError: () => toast.error("Login to save wishlist items"),
  });

  const submitReview = useMutation({
    mutationFn: () => {
      if (!product) throw new Error("No product");
      return api("/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          rating,
          comment,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Review submitted");
      setComment("");
      qc.invalidateQueries({ queryKey: ["reviews", slug] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="container-x py-20 grid place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-x py-20 text-center">
        <h2 className="font-display text-3xl mb-4">Product Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The product you are looking for does not exist or has been moved.
        </p>
        <Link to="/products" className="btn-yellow inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
      </div>
    );
  }

  const whatsappHref = waLink(productWaMessage(product.name, product.price));

  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const specs: string[] = product.specs || [];
  const allImages = [imageFor(product.image), ...getExtraImages(product.image)];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomState({ show: true, x, y });
  };

  const handleMouseLeave = () => {
    setZoomState({ show: false, x: 0, y: 0 });
  };

  const nextImage = () =>
    setCurrentImageIdx((prev) => (prev + 1) % allImages.length);
  const prevImage = () =>
    setCurrentImageIdx(
      (prev) => (prev - 1 + allImages.length) % allImages.length,
    );

  const onReview = (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Login to leave a review");
      return;
    }
    submitReview.mutate();
  };

  return (
    <div className="bg-brand-gray/30 py-10 md:py-16">
      <div className="container-x">
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand-orange transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Catalog
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            <span>/</span>
            <Link to="/products" className="hover:underline">
              Products
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{product.name}</span>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-12 bg-white rounded-2xl border border-border p-6 md:p-10 shadow-sm">
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center">
            <div
              className="relative aspect-square overflow-hidden rounded-xl border border-border bg-brand-black shadow-inner group lg:cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onMouseEnter={() =>
                setZoomState((prev) => ({ ...prev, show: true }))
              }
            >
              <img
                key={currentImageIdx}
                src={allImages[currentImageIdx]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Previous image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Next image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-3 justify-center">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIdx(idx)}
                    className={`relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImageIdx
                        ? "border-brand-yellow ring-2 ring-brand-yellow/50 shadow-md"
                        : "border-transparent opacity-70 hover:opacity-100 hover:border-brand-gray"
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative lg:col-span-6 xl:col-span-5 flex flex-col justify-between">
            {zoomState.show && (
              <div className="hidden lg:block absolute inset-0 -m-4 p-4 z-50 bg-white rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.1)] pointer-events-none border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div
                  className="w-full h-full rounded-lg"
                  style={{
                    backgroundImage: `url(${allImages[currentImageIdx]})`,
                    backgroundPosition: `${zoomState.x}% ${zoomState.y}%`,
                    backgroundSize: "250%",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              </div>
            )}

            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">
                  {product.category}
                </span>
                <button
                  type="button"
                  onClick={() => toggleWish.mutate()}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-black hover:text-brand-orange"
                >
                  <Heart
                    className={`h-5 w-5 ${wished ? "fill-brand-orange text-brand-orange" : ""}`}
                  />
                  {wished ? "Saved" : "Wishlist"}
                </button>
              </div>
              <h1 className="mt-2 font-display text-3xl md:text-4xl text-brand-black leading-tight">
                {product.name}
              </h1>

              {reviewData && reviewData.count > 0 && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-brand-yellow text-brand-yellow" />
                  {reviewData.average.toFixed(1)} ({reviewData.count} reviews)
                </div>
              )}

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-display text-brand-black">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{product.originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-2">
                  (Inclusive of all taxes)
                </span>
              </div>

              {!inStock && (
                <p className="mt-3 text-sm font-bold uppercase tracking-wide text-red-600">
                  Out of stock
                </p>
              )}

              <div className="my-6 border-t border-border pt-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-black mb-3">
                  Description
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {specs.length > 0 && (
                <div className="border-t border-border py-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-brand-black mb-3">
                    Key Specs & Features
                  </h3>
                  <ul className="grid gap-2 text-sm text-muted-foreground">
                    {specs.map((spec, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-brand-orange shrink-0" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    if (!inStock) {
                      toast.error("This product is out of stock");
                      return;
                    }
                    addToCart(product);
                  }}
                  disabled={!inStock}
                  className="btn-yellow flex-1 py-4 text-base justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {inStock ? "Add to Cart" : "Out of Stock"}
                </button>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp flex-1 py-4 text-base justify-center shadow-lg shadow-whatsapp/25 hover:shadow-xl"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Order on WhatsApp
                </a>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Buy instantly via WhatsApp, or add multiple items to your cart to
                check out together.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-6 text-center text-[10px] sm:text-xs text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                  <Truck className="h-5 w-5 text-brand-orange" />
                  <span className="font-semibold text-brand-black">
                    PAN INDIA Delivery
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="h-5 w-5 text-brand-orange" />
                  <span className="font-semibold text-brand-black">
                    Verified Quality
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RotateCcw className="h-5 w-5 text-brand-orange" />
                  <span className="font-semibold text-brand-black">
                    Dispatch Support
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-white p-6 md:p-8 shadow-sm">
          <h2 className="font-display text-2xl text-brand-black mb-6">
            Customer reviews
          </h2>

          <form onSubmit={onReview} className="mb-8 space-y-3 max-w-xl">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-0.5"
                  aria-label={`${n} stars`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      n <= rating
                        ? "fill-brand-yellow text-brand-yellow"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              rows={3}
              placeholder={
                user ? "Share your experience…" : "Login to write a review"
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={!user}
            />
            <button
              type="submit"
              className="btn-yellow"
              disabled={!user || submitReview.isPending}
            >
              {submitReview.isPending ? "Submitting…" : "Submit review"}
            </button>
          </form>

          {!reviewData?.reviews?.length ? (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <ul className="space-y-4">
              {reviewData.reviews.map((r) => (
                <li key={r.id} className="border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3.5 w-3.5 ${
                            n <= r.rating
                              ? "fill-brand-yellow text-brand-yellow"
                              : "text-muted-foreground/40"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold">{r.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {r.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <span className="chip">Recommendations</span>
                <h2 className="mt-2 font-display text-2xl md:text-3xl text-brand-black">
                  More from this category
                </h2>
              </div>
              <Link
                to="/products"
                className="text-sm font-bold text-brand-orange hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
