import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import categories from "@/data/categories.json";
import { imageFor } from "@/lib/images";
import allCateImg from "@/assets/allcate.webp";

export function Categories() {
  return (
    <section id="categories" className="section-pad bg-white">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <span className="chip">Shop by category</span>
            <h2 className="mt-4 font-display text-4xl text-brand-black md:text-5xl">Pick your arena.</h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            Crawlers, racers, excavators and more — explore the full DIG & DRIVE lineup.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {/* Dynamic Categories */}
          {categories.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              whileHover={{ y: -8 }}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-brand-black"
            >
              <Link to={`/products?category=${encodeURIComponent(c.name)}`} className="absolute inset-0 z-20">
                <span className="sr-only">Explore {c.name}</span>
              </Link>
              <img
                src={imageFor(c.image)}
                alt={c.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover opacity-70 transition-all duration-500 group-hover:scale-110 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="h-0.5 w-8 bg-brand-orange transition-all duration-300 group-hover:w-16 group-hover:bg-brand-yellow" />
                <h3 className="mt-2 font-display text-xl text-white md:text-2xl">{c.name}</h3>
                <span className="mt-1 inline-block text-[10px] uppercase tracking-[0.2em] text-brand-yellow opacity-0 transition-opacity group-hover:opacity-100">
                  Explore →
                </span>
              </div>
            </motion.div>
          ))}

          {/* All Products Card (Last) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: categories.length * 0.04 }}
            whileHover={{ y: -8 }}
            className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-brand-black"
          >
            <Link to="/products" className="absolute inset-0 z-20">
              <span className="sr-only">Explore All Products</span>
            </Link>
            <img
              src={allCateImg}
              alt="All Products"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-70 transition-all duration-500 group-hover:scale-110 group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="h-0.5 w-8 bg-brand-orange transition-all duration-300 group-hover:w-16 group-hover:bg-brand-yellow" />
              <h3 className="mt-2 font-display text-xl text-white md:text-2xl">All Products</h3>
              <span className="mt-1 inline-block text-[10px] uppercase tracking-[0.2em] text-brand-yellow opacity-0 transition-opacity group-hover:opacity-100">
                Explore →
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
