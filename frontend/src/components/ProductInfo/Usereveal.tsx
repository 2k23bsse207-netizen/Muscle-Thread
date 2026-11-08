import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Fades up every [data-reveal] element inside the section, once, when the
 * section scrolls into view. Elements are hidden up-front (gsap.set) so they
 * never flash visible before animating.
 */
export function useReveal<T extends HTMLElement>(stagger = 0.09) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const section = ref.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const elements = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      if (!elements.length) return;

      gsap.set(elements, { autoAlpha: 0, y: 36 });
      gsap.to(elements, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        stagger,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 82%", once: true },
      });
    }, section);

    return () => ctx.revert();
  }, [stagger]);

  return ref;
}