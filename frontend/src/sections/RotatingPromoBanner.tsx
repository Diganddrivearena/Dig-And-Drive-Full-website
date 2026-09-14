import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBanners } from "@/hooks/useCatalog";
import { imageFor, placeholderImg } from "@/lib/images";
import type { ApiBanner } from "@/lib/api";

type Slide = {
  id: string;
  href: string;
  image: string;
};

function bannerSrc(value: string) {
  if (!value) return placeholderImg;
  if (value.startsWith("http") || value.startsWith("/") || value.startsWith("data:")) {
    return value;
  }
  return imageFor(value);
}

function buildSlides(banners: ApiBanner[]): Slide[] {
  if (banners.length) {
    return banners.map((b) => ({
      id: `banner-${b.id}`,
      href: b.linkUrl || "/products",
      image: bannerSrc(b.imageUrl),
    }));
  }
  return [
    {
      id: "fallback",
      href: "/products",
      image: "/firstsection.webp",
    },
  ];
}

/** Full-bleed hero carousel — image only (no title/subtitle overlay). */
export function RotatingPromoBanner() {
  const { data: banners = [], isLoading } = useBanners();
  const slides = useMemo(() => buildSlides(banners), [banners]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (isLoading) {
    return (
      <section className="relative bg-brand-black text-white aspect-[21/9] min-h-[42vh] max-h-[85vh] grid place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-yellow border-t-transparent" />
      </section>
    );
  }

  const slide = slides[index] ?? slides[0];
  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + slides.length) % slides.length);
  };

  return (
    <section className="relative bg-brand-black overflow-hidden">
      <div className="relative aspect-[21/9] w-full min-h-[42vh] max-h-[85vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
            className="absolute inset-0"
          >
            <Link to={slide.href} className="absolute inset-0 block" aria-label="Shop now">
              <img
                src={slide.image}
                alt=""
                className="h-full w-full object-contain"
              />
            </Link>
          </motion.div>
        </AnimatePresence>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 rounded-full border border-white/25 bg-black/40 p-2.5 text-white hover:bg-brand-yellow hover:text-brand-black transition-colors cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 rounded-full border border-white/25 bg-black/40 p-2.5 text-white hover:bg-brand-yellow hover:text-brand-black transition-colors cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
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
