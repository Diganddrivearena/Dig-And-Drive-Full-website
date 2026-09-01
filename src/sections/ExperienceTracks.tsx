import { motion } from "framer-motion";
import { Mountain, HardHat, Car, Dribbble, Swords } from "lucide-react";

const TRACKS = [
  {
    title: "Mountain Crawler Adventure",
    desc: "Navigate rocky terrain, steep climbs, bridges, and obstacles.",
    icon: Mountain,
  },
  {
    title: "Construction Challenge Zone",
    desc: "Operate excavators, dump trucks, loaders, and cranes in a realistic construction environment.",
    icon: HardHat,
  },
  {
    title: "Drift Arena",
    desc: "Master precision drifting on a professionally designed RC drift circuit.",
    icon: Car,
  },
  {
    title: "RC Football Arena",
    desc: "Compete in exciting RC-powered football matches.",
    icon: Dribbble,
  },
  {
    title: "RC Battle Arena",
    desc: "High-energy RC car battles inspired by wrestling and demolition challenges.",
    icon: Swords,
  },
];

export function ExperienceTracks() {
  return (
    <section id="tracks" className="section-pad bg-brand-gray relative overflow-hidden">
      <div className="container-x relative z-10">
        <div className="mb-12 text-center">
          <span className="chip bg-brand-black text-white">Coming Soon</span>
          <h2 className="mt-4 font-display text-4xl text-brand-black md:text-5xl">
            🏁 RC Experience Tracks
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Get ready for an adrenaline-pumping experience. We're building world-class RC tracks and arenas.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
          {TRACKS.map((track, i) => (
            <motion.div
              key={track.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-white p-4 sm:p-6 shadow-sm hover:border-brand-yellow hover:shadow-md transition-all ${
                i === 2 ? "col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="mb-3 sm:mb-4 grid h-10 w-10 sm:h-14 sm:w-14 place-items-center rounded-xl bg-brand-yellow/10 text-brand-orange group-hover:bg-brand-yellow group-hover:text-brand-black transition-colors">
                <track.icon className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <h3 className="font-display text-lg sm:text-xl text-brand-black leading-tight">{track.title}</h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">{track.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
