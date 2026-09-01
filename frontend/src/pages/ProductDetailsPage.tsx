import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, ShieldCheck, Truck, RotateCcw, ShoppingBag } from "lucide-react";
import { imageFor, getExtraImages } from "@/lib/images";
import { productWaMessage, waLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { ProductCard } from "@/components/ProductCard";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useProduct, useProducts } from "@/hooks/useCatalog";

export function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug);
  const { data: allProducts = [] } = useProducts();
  const { addToCart } = useCart();
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [zoomState, setZoomState] = useState({ show: false, x: 0, y: 0 });

  useEffect(() => {
    window.scrollTo(0, 0);
    setCurrentImageIdx(0);
  }, [slug]);

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
        <p className="text-muted-foreground mb-8">The product you are looking for does not exist or has been moved.</p>
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

  const nextImage = () => setCurrentImageIdx((prev) => (prev + 1) % allImages.length);
  const prevImage = () => setCurrentImageIdx((prev) => (prev - 1 + allImages.length) % allImages.length);

  return (
    <div className="bg-brand-gray/30 py-10 md:py-16">
      <div className="container-x">
        {/* Back Button & Breadcrumbs */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand-orange transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Catalog
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{product.name}</span>
          </div>
        </div>

        {/* 2-Column Product Section */}
        <div className="grid gap-10 lg:grid-cols-12 bg-white rounded-2xl border border-border p-6 md:p-10 shadow-sm">
          {/* Left Side: Product Image Carousel */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center">
            <div 
              className="relative aspect-square overflow-hidden rounded-xl border border-border bg-brand-black shadow-inner group lg:cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onMouseEnter={() => setZoomState(prev => ({ ...prev, show: true }))}
            >
              <img
                key={currentImageIdx}
                src={allImages[currentImageIdx]}
                alt={`${product.name} - image ${currentImageIdx + 1}`}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className={`h-full w-full object-cover transition-transform duration-700 animate-in fade-in zoom-in-95 ${!zoomState.show ? "hover:scale-105" : ""}`}
              />

              {/* Amazon-style lens overlay on the main image */}
              {zoomState.show && (
                <div 
                  className="hidden lg:flex absolute pointer-events-none border border-brand-orange bg-white/40 transition-opacity shadow-sm items-center justify-center overflow-hidden"
                  style={{
                    left: `${Math.max(0, Math.min(zoomState.x - 15, 70))}%`,
                    top: `${Math.max(0, Math.min(zoomState.y - 15, 70))}%`,
                    width: '30%',
                    height: '30%',
                    backgroundImage: 'radial-gradient(rgba(0,0,0,0.3) 1px, transparent 1px)',
                    backgroundSize: '4px 4px'
                  }}
                >
                  <style>
                    {`
                      @keyframes square-pulse {
                        0% { transform: scale(0); opacity: 0.8; border-width: 2px; }
                        100% { transform: scale(2.5); opacity: 0; border-width: 4px; }
                      }
                      .animate-square-pulse {
                        animation: square-pulse 1.5s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
                      }
                    `}
                  </style>
                  <div className="w-1/2 h-1/2 border border-brand-orange absolute animate-square-pulse" />
                </div>
              )}

              
              {/* Carousel Controls */}
              {allImages.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all z-10"
                    aria-label="Previous image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all z-10"
                    aria-label="Next image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Navigation */}
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

          {/* Right Side: Product Details & Descriptions */}
          <div className="relative lg:col-span-6 xl:col-span-5 flex flex-col justify-between">
            {/* Zoom Overlay Box (Desktop Only) */}
            {zoomState.show && (
              <div 
                className="hidden lg:block absolute inset-0 -m-4 p-4 z-50 bg-white rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.1)] pointer-events-none border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              >
                <div 
                  className="w-full h-full rounded-lg"
                  style={{
                    backgroundImage: `url(${allImages[currentImageIdx]})`,
                    backgroundPosition: `${zoomState.x}% ${zoomState.y}%`,
                    backgroundSize: '250%',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              </div>
            )}

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">
                {product.category}
              </span>
              <h1 className="mt-2 font-display text-3xl md:text-4xl text-brand-black leading-tight">
                {product.name}
              </h1>
              
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-display text-brand-black">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{product.originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-2">(Inclusive of all taxes)</span>
              </div>

              <div className="my-6 border-t border-border pt-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-black mb-3">
                  Description
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Product Specs List */}
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

            {/* Buying Actions */}
            <div className="border-t border-border pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => addToCart(product)}
                  className="btn-yellow flex-1 py-4 text-base justify-center"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Add to Cart
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
                Buy instantly via WhatsApp, or add multiple items to your cart to check out together.
              </p>

              {/* Value Props */}
              <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-6 text-center text-[10px] sm:text-xs text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                  <Truck className="h-5 w-5 text-brand-orange" />
                  <span className="font-semibold text-brand-black">PAN INDIA Delivery</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="h-5 w-5 text-brand-orange" />
                  <span className="font-semibold text-brand-black">Verified Quality</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RotateCcw className="h-5 w-5 text-brand-orange" />
                  <span className="font-semibold text-brand-black">Dispatch Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <span className="chip">Recommendations</span>
                <h2 className="mt-2 font-display text-2xl md:text-3xl text-brand-black">
                  More from this category
                </h2>
              </div>
              <Link to="/products" className="text-sm font-bold text-brand-orange hover:underline">
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
