import { ShieldCheck, Truck, Package, BadgeCheck, Users } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { motion } from "framer-motion";

const FEATURES = [
  { Icon: ShieldCheck, title: "Premium Quality", text: "Hand-picked, durable hobby-grade builds." },
  { Icon: WhatsAppIcon, title: "Fast WhatsApp Orders", text: "Tap. Send. Done. No checkout hassle." },
  { Icon: Truck, title: "PAN INDIA Delivery", text: "Trusted couriers with full tracking." },
  { Icon: Package, title: "Secure Packaging", text: "Foam-wrapped, double-boxed and safe." },
  { Icon: BadgeCheck, title: "Trusted Brand", text: "Backed by 50+ happy collectors." },
  { Icon: Users, title: "Kids & Hobbyists", text: "From toddlers to pro RC enthusiasts." },
];

export function Features() {
  return (
    <section className="section-pad bg-brand-gray">
      <div className="container-x">
        <div className="mb-10 text-center">
          <span className="chip">Why Dig & Drive</span>
          <h2 className="mt-4 font-display text-4xl text-brand-black md:text-5xl">Built for the love of the game.</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`group relative overflow-hidden rounded-xl border border-border bg-white p-4 sm:p-6 transition-all hover:border-brand-yellow hover:shadow-lg ${
                i === 2 || i === 5 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-lg bg-brand-yellow text-brand-black">
                <f.Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="mt-3 sm:mt-4 font-display text-lg sm:text-xl text-brand-black leading-tight">{f.title}</h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{f.text}</p>
              <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-brand-orange/0 transition-colors group-hover:bg-brand-orange/10" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
