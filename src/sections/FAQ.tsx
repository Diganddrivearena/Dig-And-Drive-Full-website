import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import faqs from "@/data/faqs.json";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="section-pad bg-white">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          <span className="chip">FAQ</span>
          <h2 className="mt-4 font-display text-4xl text-brand-black md:text-5xl">Got questions?</h2>
          <p className="mt-4 text-muted-foreground">Quick answers about ordering, shipping and warranty. Still unsure? Ping us on WhatsApp.</p>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="rounded-xl border border-border bg-white overflow-hidden transition-colors hover:border-brand-yellow">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-display text-lg text-brand-black">{f.q}</span>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${isOpen ? "bg-brand-orange text-white" : "bg-brand-yellow text-brand-black"}`}>
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-muted-foreground leading-relaxed">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
