import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useBanners, useProducts } from "@/hooks/useCatalog";
import { imageFor, placeholderImg } from "@/lib/images";
import type { ApiBanner, ApiProduct } from "@/lib/api";

type Slide =
  | { kind: "banner"; id: string; title: string; subtitle: string; href: string; image: string }
  | { kind: "product"; id: string; title: string; subtitle: string; href: string; image: string; price: number };

function bannerSrc(value: string) {
  if (!value) return placeholderImg;
  if (value.startsWith("http") || value.startsWith("/") || value.startsWith("data:")) {
    return value;
  }
  return imageFor(value);
}

function buildSlides(banners: ApiBanner[], products: ApiProduct[]): Slide[] {
  const bannerSlides: Slide[] = banners.map((b) => ({
    kind: "banner",
    id: `banner-${b.id}`,
    title: b.title,
    subtitle: b.subtitle || "Shop Dig & Drive",
    href: b.linkUrl || "/products",
    image: bannerSrc(b.imageUrl),
  }));

  const latest = [...products]
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
      return tb - ta;
    })
    .slice(0, 6);

  const productSlides: Slide[] = latest.map((p) => ({
    kind: "product",
    id: `product-${p.id}`,
    title: p.name,
    subtitle: "New arrival",
    href: `/products/${p.slug}`,
    image: imageFor(p.image),
    price: p.price,
  }));

  // Interleave product highlights with CMS banners when both exist
  if (!bannerSlides.length) return productSlides;
  if (!productSlides.length) return bannerSlides;

  const merged: Slide[] = [];
  const max = Math.max(bannerSlides.length, productSlides.length);
  for (let i = 0; i < max; i++) {
    if (bannerSlides[i]) merged.push(bannerSlides[i]);
    if (productSlides[i]) merged.push(productSlides[i]);
  }
  return merged;
}

export function RotatingPromoBanner() {
  const { data: banners = [] } = useBanners();
  const { data: products = [], isLoading } = useProducts();
  const slides = useMemo(() => buildSlides(banners, products), [banners, products]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (isLoading || slides.length === 0) return null;

  const slide = slides[index] ?? slides[0];
  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + slides.length) % slides.length);
  };

  return (
    <section className="relative bg-brand-black text-white overflow-hidden">
      <div className="relative min-h-[420px] md:min-h-[520px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
            className="absolute inset-0"
          >
            <img
              src={slide.image}
              alt=""
              className="h-full w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/75 to-brand-black/30" />
          </motion.div>
        </AnimatePresence>

        <div className="container-x relative z-10 flex min-h-[420px] md:min-h-[520px] items-center py-16">
          <div className="max-w-xl">
            <span className="chip bg-brand-orange text-white">
              {slide.kind === "product" ? "New product" : "Featured"}
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id + "-copy"}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="mt-4 font-display text-4xl md:text-6xl leading-tight">
                  {slide.title}
                </h2>
                <p className="mt-3 text-white/75 text-lg">{slide.subtitle}</p>
                {slide.kind === "product" && (
                  <p className="mt-2 font-display text-2xl text-brand-yellow">
                    ₹{slide.price.toLocaleString("en-IN")}
                  </p>
                )}
                <Link to={slide.href} className="btn-yellow mt-6 inline-flex">
                  {slide.kind === "product" ? "View product" : "Shop now"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 rounded-full border border-white/25 bg-black/40 p-2 text-white hover:bg-brand-yellow hover:text-brand-black transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 rounded-full border border-white/25 bg-black/40 p-2 text-white hover:bg-brand-yellow hover:text-brand-black transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-8 bg-brand-yellow" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
