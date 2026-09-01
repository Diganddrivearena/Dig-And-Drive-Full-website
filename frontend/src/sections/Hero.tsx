import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import hero from "@/assets/hero.webp";
import { waLink } from "@/lib/site";

export function Hero() {
  return (
    <section id="home" className="relative isolate overflow-hidden bg-brand-black text-white">
      <div className="absolute inset-0">
        <img src={hero} alt="" width={1920} height={1080} loading="eager" fetchPriority="high" decoding="async" className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black to-transparent" />
      </div>

      <div className="container-x relative grid min-h-[88vh] items-center py-20">
        <div className="max-w-2xl text-center md:text-left mx-auto md:mx-0">

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 mb-2"
          >
            <img 
              src="/firstsection.webp" 
              alt="Dig. Drive. Play." 
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[420px] max-h-[40vh] h-auto object-contain object-center md:object-left mx-auto md:mx-0 drop-shadow-2xl"
            />
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-display text-2xl text-brand-yellow uppercase tracking-widest mb-4"
          >
            Drive. Build. Drift. Fly. Compete.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="max-w-xl text-lg text-white/80"
          >
            Experience premium RC vehicles, collectible models, exciting RC tracks, and unforgettable events—all in one destination.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 flex flex-wrap justify-center md:justify-start gap-3"
          >
            <Link to="/products" className="btn-yellow">
              Explore Products <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={waLink("Hello DIG & DRIVE ARENA, I'd like to know more about your products.")} target="_blank" rel="noopener noreferrer" className="btn-outline-dark">
              <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
            </a>
          </motion.div>

          <div className="mt-12 grid max-w-lg grid-cols-3 gap-3 sm:gap-6 border-t border-white/15 pt-6 mx-auto md:mx-0">
            {[
              { k: "50+", v: "Happy customers" },
              { k: "20+", v: "Premium SKUs" },
              { k: "PAN INDIA", v: "Delivery" },
            ].map((s) => (
              <div key={s.v}>
                <div className="font-display text-3xl text-brand-yellow">{s.k}</div>
                <div className="text-xs uppercase tracking-wider text-white/60">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
