import { motion } from "framer-motion";
import { Cake, Briefcase, GraduationCap, Trophy } from "lucide-react";

const EVENTS = [
  {
    title: "Birthday Parties",
    desc: "Unique RC-themed birthday celebrations.",
    icon: Cake,
  },
  {
    title: "Corporate Events",
    desc: "Team-building activities and competitions.",
    icon: Briefcase,
  },
  {
    title: "School Events",
    desc: "Educational and entertainment RC experiences.",
    icon: GraduationCap,
  },
  {
    title: "RC Competitions",
    desc: "Drift, crawler, construction, and racing events.",
    icon: Trophy,
  },
];

export function Events() {
  return (
    <section id="events" className="section-pad bg-brand-black text-white">
      <div className="container-x">
        <div className="mb-12 text-center">
          <span className="chip bg-white text-brand-black">Host with us</span>
          <h2 className="mt-4 font-display text-4xl text-white md:text-5xl">
            🎉 Parties & Events
          </h2>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            Make your next event unforgettable with Dig & Drive Arena. Perfect for groups of all sizes.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {EVENTS.map((evt, i) => (
            <motion.div
              key={evt.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              <div className="mb-3 sm:mb-4 grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl bg-brand-yellow text-brand-black">
                <evt.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="font-display text-lg sm:text-xl text-white leading-tight">{evt.title}</h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-white/70">{evt.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
