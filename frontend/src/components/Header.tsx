import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Phone, MapPin, Truck, X, ShoppingBag, LogOut, UserRound } from "lucide-react";
import { useState } from "react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import logo from "@/assets/logo.webp";
import { SITE, waLink } from "@/lib/site";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { HeaderSearch } from "@/components/HeaderSearch";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsOpen, cartCount } = useCart();
  const { user, isAdmin, signOut, isPending } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/" && !location.hash;
    }
    if (href.startsWith("/#")) {
      return location.pathname === "/" && location.hash === href.replace("/", "");
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-brand-black text-white text-xs">
        <div className="container-x flex flex-wrap items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-3 text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-brand-yellow" /> {SITE.phone}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-brand-yellow" /> {SITE.location}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-brand-yellow" /> PAN INDIA Delivery
            </span>
          </div>
          <span className="text-brand-yellow font-semibold uppercase tracking-wider hidden md:block">
            Order anything on WhatsApp · Same-day dispatch
          </span>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur border-b border-border">
        <div className="container-x flex items-center justify-between gap-2 py-2">
          <Link to="/" className="flex items-center gap-2" aria-label="DIG & DRIVE ARENA home">
            <img
              src={logo}
              alt="DIG & DRIVE ARENA"
              width={40}
              height={40}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-9 w-9 sm:h-11 sm:w-11 object-contain flex-shrink-0"
            />
            <div className="leading-tight min-w-0">
              <div className="font-display text-base sm:text-xl text-brand-black whitespace-nowrap">
                DIG & DRIVE <span className="text-brand-orange">ARENA</span>
              </div>
              <div className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-brand-dark">
                Dig, Drive and Play
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold uppercase tracking-wide">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.href}
                className={`transition-colors hover:text-brand-orange ${
                  isActive(n.href) ? "text-brand-orange" : "text-brand-black"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <HeaderSearch />
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 text-brand-black hover:text-brand-orange transition-colors mr-1 cursor-pointer"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white shadow-md">
                  {cartCount}
                </span>
              )}
            </button>

            {!isPending &&
              (user ? (
                <div className="hidden sm:flex items-center gap-1">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="rounded-md border-2 border-brand-orange px-2 py-1.5 text-xs font-bold text-brand-orange hover:bg-brand-orange hover:text-white transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                  <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-brand-black max-w-[120px] truncate px-1">
                    <UserRound className="h-3.5 w-3.5 shrink-0" />
                    {user.name?.split(" ")[0] || "Account"}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="p-2 text-brand-black hover:text-brand-orange"
                    aria-label="Sign out"
                    title={user.email}
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => navigate("/login")}
                    className="rounded-md border-2 border-brand-black px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-black hover:bg-brand-black hover:text-white transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate("/login?mode=register")}
                    className="rounded-md bg-brand-orange px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-brand-black transition-colors"
                  >
                    Register
                  </button>
                </div>
              ))}

            <a
              href={`tel:${SITE.phoneRaw}`}
              className="hidden xl:inline-flex items-center gap-2 rounded-md border-2 border-brand-black px-3 py-2 text-sm font-bold text-brand-black hover:bg-brand-black hover:text-white transition-colors"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
            <a
              href={waLink("Hello DIG & DRIVE ARENA, I have a query.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp text-sm !px-3 sm:!px-5"
            >
              <WhatsAppIcon className="h-5 w-5" />{" "}
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 text-brand-black"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="lg:hidden border-t border-border bg-white">
            <div className="container-x flex flex-col py-2">
              {NAV.map((n) => (
                <Link
                  key={n.label}
                  to={n.href}
                  onClick={() => setOpen(false)}
                  className={`py-3 text-sm font-semibold uppercase tracking-wide transition-colors border-b border-border last:border-0 hover:text-brand-orange ${
                    isActive(n.href) ? "text-brand-orange" : "text-brand-black"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
              {!user && (
                <div className="flex gap-2 py-3">
                  <button
                    className="flex-1 rounded-md border-2 border-brand-black py-2 text-xs font-bold uppercase"
                    onClick={() => {
                      setOpen(false);
                      navigate("/login");
                    }}
                  >
                    Login
                  </button>
                  <button
                    className="flex-1 rounded-md bg-brand-orange py-2 text-xs font-bold uppercase text-white"
                    onClick={() => {
                      setOpen(false);
                      navigate("/login?mode=register");
                    }}
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
