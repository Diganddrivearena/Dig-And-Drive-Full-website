import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { motion } from "framer-motion";
import products from "@/data/products.json";
import { ProductCard } from "@/components/ProductCard";
import { waLink } from "@/lib/site";

export function FeaturedProducts() {
  const items = products.slice(0, 8);
  return (
    <section className="section-pad bg-white">
      <div className="container-x">
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="chip">Featured</span>
            <h2 className="mt-4 font-display text-4xl text-brand-black md:text-5xl">This week's hot machines.</h2>
          </div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {items.map((p) => (
            <motion.div key={p.id} variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}>
              <ProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
