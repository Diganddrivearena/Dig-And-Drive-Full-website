import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { waLink } from "@/lib/site";
import { ScrollToHash } from "@/components/ScrollToHash";
import { CartDrawer } from "@/components/CartDrawer";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { ReactLenis } from "lenis/react";

export function Layout() {
  const [smooth, setSmooth] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent);
    setSmooth(!coarse && !ios);
  }, []);

  const content = (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ScrollToHash />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <ScrollToTopButton />

      <a
        href={waLink("Hello DIG & DRIVE ARENA, I'd like to know more.")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="hidden sm:grid fixed bottom-5 right-5 z-50 h-14 w-14 place-items-center rounded-2xl bg-whatsapp text-white shadow-2xl shadow-whatsapp/40 transition-transform hover:scale-110"
      >
        <WhatsAppIcon className="h-7 w-7" />
        <span className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-whatsapp/40" />
      </a>
    </div>
  );

  return smooth ? <ReactLenis root>{content}</ReactLenis> : content;
}
