import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { imageFor, placeholderImg } from "@/lib/images";
import { useBanners } from "@/hooks/useCatalog";

const ACCENTS = [
  "bg-brand-orange",
  "bg-brand-yellow text-brand-black",
  "bg-brand-black",
];

function bannerSrc(value: string) {
  if (!value) return placeholderImg;
  if (value.startsWith("http") || value.startsWith("/") || value.startsWith("data:")) {
    return value;
  }
  return imageFor(value);
}

export function PromoBanners() {
  const { data: banners = [], isLoading } = useBanners();

  if (isLoading || banners.length === 0) return null;

  return (
    <section className="section-pad bg-brand-gray">
      <div className="container-x">
        <div className="grid gap-5 md:grid-cols-3">
          {banners.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Link
                to={b.linkUrl || "/products"}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-brand-black block"
              >
                <img
                  src={bannerSrc(b.imageUrl)}
                  alt={b.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover opacity-75 transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-brand-black/80 via-brand-black/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                  <span className={`chip ${ACCENTS[i % ACCENTS.length]} self-start`}>
                    {b.subtitle || "Promo"}
                  </span>
                  <div className="flex items-end justify-between">
                    <h3 className="font-display text-3xl md:text-4xl">{b.title}</h3>
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-yellow text-brand-black transition-transform group-hover:rotate-45">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
