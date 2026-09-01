import { Link } from "react-router-dom";
import { Instagram, Phone, Mail, MapPin } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import logo from "@/assets/logo.webp";

import { SITE, waLink } from "@/lib/site";
import categories from "@/data/categories.json";

export function Footer() {
  return (
    <footer
      className="relative text-white overflow-hidden"
      style={{
        backgroundImage: "url('/footer.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 z-0 bg-brand-black/80" />
      <div className="relative z-10 container-x grid gap-10 py-24 md:py-32 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="DIG & DRIVE ARENA" loading="lazy" decoding="async" className="h-14 w-14 object-contain bg-white/5 rounded-md p-1" />
            <div>
              <div className="font-display text-lg">DIG & DRIVE <span className="text-brand-orange">ARENA</span></div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">Dig, Drive and Play</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/70">
            Premium RC vehicles, excavators, crawlers and construction toys for kids, hobbyists and collectors across India.
          </p>
          <div className="mt-5 flex gap-3">
            <a href="https://www.instagram.com/diganddrivearena?igsh=dnN6ZHZ2NHBwa3Ri" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Instagram" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-brand-yellow hover:text-brand-black transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
          </div>

        </div>

        <div>
          <h4 className="font-display text-base text-brand-yellow uppercase tracking-wider mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/" className="hover:text-brand-yellow">Home</Link></li>
            <li><Link to="/products" className="hover:text-brand-yellow">Products</Link></li>
            <li><Link to="/#about" className="hover:text-brand-yellow">About</Link></li>
            <li><Link to="/#contact" className="hover:text-brand-yellow">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base text-brand-yellow uppercase tracking-wider mb-4">Categories</h4>
          <ul className="space-y-2 text-sm text-white/70">
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/products?category=${encodeURIComponent(c.name)}`} className="hover:text-brand-yellow">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base text-brand-yellow uppercase tracking-wider mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 text-brand-orange mt-0.5" />{SITE.address}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-orange" /><a href={`tel:${SITE.phoneRaw}`} className="hover:text-brand-yellow">{SITE.phone}</a></li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-orange" /><a href={`mailto:${SITE.email}`} className="hover:text-brand-yellow">{SITE.email}</a></li>
            <li><a href={waLink("Hello DIG & DRIVE ARENA")} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-2 text-sm"><WhatsAppIcon className="h-5 w-5" /> Chat now</a></li>
          </ul>
        </div>


      </div>

      <div className="relative z-10 border-t border-white/10">
        <div className="container-x py-5 text-xs text-white/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} DIG & DRIVE ARENA. All rights reserved.</span>
          <a 
            href="https://www.staffarc.in" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <span>Designed & Developed By</span>
            <img src="/Staffarc-logo.avif" alt="StaffArc" loading="lazy" decoding="async" className="h-4 object-contain" />
          </a>
        </div>
      </div>
    </footer>
  );
}
