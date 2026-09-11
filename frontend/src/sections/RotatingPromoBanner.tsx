import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useBanners } from "@/hooks/useCatalog";
import { imageFor, placeholderImg } from "@/lib/images";
import type { ApiBanner } from "@/lib/api";
import { SITE } from "@/lib/site";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
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
      title: b.title,
      subtitle: b.subtitle || SITE.tagline,
      href: b.linkUrl || "/products",
      image: bannerSrc(b.imageUrl),
    }));
  }
  return [
    {
      id: "fallback",
      title: SITE.name,
      subtitle: SITE.tagline,
      href: "/products",
      image: "/firstsection.webp",
    },
  ];
}

/** Full-bleed hero carousel driven by admin banners. */
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
      <section className="relative bg-brand-black text-white min-h-[70vh] md:min-h-[85vh] grid place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-yellow border-t-transparent" />
      </section>
    );
  }

  const slide = slides[index] ?? slides[0];
  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + slides.length) % slides.length);
  };

  return (
    <section className="relative bg-brand-black text-white overflow-hidden">
      <div className="relative min-h-[70vh] md:min-h-[85vh]">
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
              className="h-full w-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/70 to-brand-black/25" />
          </motion.div>
        </AnimatePresence>

        <div className="container-x relative z-10 flex min-h-[70vh] md:min-h-[85vh] items-center py-16">
          <div className="max-w-2xl">
            <span className="chip bg-brand-orange text-white">DIG &amp; DRIVE ARENA</span>
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id + "-copy"}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="mt-4 font-display text-4xl md:text-7xl leading-tight">
                  {slide.title}
                </h1>
                <p className="mt-4 text-white/80 text-lg md:text-xl max-w-xl">
                  {slide.subtitle}
                </p>
                <Link to={slide.href} className="btn-yellow mt-8 inline-flex text-base px-8 py-3.5">
                  Shop now <ArrowRight className="h-5 w-5" />
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
            <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-2">
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
