import { motion } from "framer-motion";
import logo from "@/assets/logo.webp";

export function About() {
  return (
    <section id="about" className="section-pad bg-white">
      <div className="container-x grid items-center gap-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="absolute -inset-4 rounded-3xl bg-brand-yellow/30 blur-2xl" />
          <img 
            src={logo} 
            alt="DIG & DRIVE ARENA logo" 
            loading="lazy"
            decoding="async"
            className="relative w-full rounded-2xl border-4 border-brand-black bg-white object-cover shadow-xl" 
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="chip">Our story</span>
          <h2 className="mt-4 font-display text-4xl text-brand-black md:text-5xl">Where construction meets the race line.</h2>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
            <strong className="text-brand-black">DIG & DRIVE ARENA</strong> specializes in RC vehicles, construction toys,
            excavators, crawlers and hobby-grade vehicles for kids, enthusiasts and collectors.
          </p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            We bring exciting remote-control experiences that combine fun, learning and adventure —
            sourced from trusted makers and dispatched fresh from our Mumbai arena.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { k: "50+", v: "Happy customers" },
              { k: "20+", v: "Premium SKUs" },
              { k: "PAN INDIA", v: "Delivery" },
            ].map((s) => (
              <div key={s.v} className="rounded-lg border border-border p-4">
                <div className="font-display text-2xl text-brand-orange">{s.k}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
