import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) {
      // Fallback to window scroll if lenis is not ready/used
      const handleScroll = () => {
        setIsVisible(window.scrollY > 300);
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }

    const handleLenisScroll = (e: any) => {
      setIsVisible(e.scroll > 300);
    };

    lenis.on("scroll", handleLenisScroll);
    return () => {
      lenis.off("scroll", handleLenisScroll);
    };
  }, [lenis]);

  const scrollToTop = () => {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 sm:bottom-24 z-50 flex h-12 w-12 items-center justify-center rounded-none border-2 border-brand-yellow bg-brand-black text-brand-yellow shadow-lg transition-colors duration-300 hover:bg-brand-yellow hover:text-brand-black hover:border-brand-orange cursor-pointer"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-6 w-6 stroke-[2.5]" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
