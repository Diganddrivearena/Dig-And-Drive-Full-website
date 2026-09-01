import { motion } from "framer-motion";
import { imageFor } from "@/lib/images";

const IMGS = [
  "diecast-huina-1611",
  "huina-1533",
  "cat-offroad",
  "huina-1552",
  "trasped-412",
  "cat-drone",
  "huina-1579",
  "cat-construction"
];

export function Gallery() {
  return (
    <section id="gallery" className="section-pad bg-brand-black text-white">
      <div className="container-x">
        <div className="mb-10 flex flex-col items-center text-center">
          <span className="chip">@diganddrivearena</span>
          <h2 className="mt-4 font-display text-4xl md:text-5xl">From the arena.</h2>
          <p className="mt-3 max-w-lg text-white/70">Explore our gallery of premium RC vehicles.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3">
          {IMGS.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="group relative aspect-square overflow-hidden rounded-lg bg-brand-black"
            >
              <img src={imageFor(img)} alt={`Gallery post ${i + 1}`} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
