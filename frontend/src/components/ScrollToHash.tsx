import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLenis } from "lenis/react";

export function ScrollToHash() {
  const { pathname, hash } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    if (hash) {
      // Small delay to let the page render before scrolling to the element
      const timer = setTimeout(() => {
        const id = hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          lenis.scrollTo(element, { offset: -80, duration: 1.2 });
        }
      }, 120);
      return () => clearTimeout(timer);
    } else {
      // Instantly jump to top on page navigation (no animation on route change)
      lenis.scrollTo(0, { immediate: true });
    }
  }, [pathname, hash, lenis]);

  return null;
}
