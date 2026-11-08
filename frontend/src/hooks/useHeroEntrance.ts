import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export default function useHeroEntrance<
  T extends HTMLElement = HTMLDivElement
>() {
  const rootRef = useRef<T>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const background = root.querySelectorAll('[data-hero="bg"]');

      const move = root.querySelector('[data-hero="move"]');
      const headline = root.querySelector('[data-hero="headline"]');
      const rail = root.querySelector('[data-hero="rail"]');
      const tagline = root.querySelector('[data-hero="tagline"]');
      const cta = root.querySelector('[data-hero="cta"]');
      const pagination = root.querySelector('[data-hero="pagination"]');

      const tl = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      // 1. Background image appears first
      tl.fromTo(
        background,
        {
          opacity: 0,
          scale: 1.05,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 1.3,
          stagger: 0.05,
          ease: "power2.out",
        }
      );

      // 2. MOVE headline
      tl.fromTo(
        move,
        {
          opacity: 0,
          y: 45,
          clipPath: "inset(0 0 100% 0)",
        },
        {
          opacity: 1,
          y: 0,
          clipPath: "inset(0 0 0% 0)",
          duration: 0.85,
        },
        "-=0.25"
      );

      // 3. WITHOUT LIMITS appears together
      tl.fromTo(
        headline,
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
        },
        "-=0.35"
      );

      // 4. Vertical rail
      tl.fromTo(
        rail,
        {
          opacity: 0,
          x: -20,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.65,
        },
        "-=0.2"
      );

      // 5. Tagline
      tl.fromTo(
        tagline,
        {
          opacity: 0,
          y: 25,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
        },
        "-=0.15"
      );

      // 6. CTA
      tl.fromTo(
        cta,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
        },
        "-=0.2"
      );

      // 7. Pagination
      tl.fromTo(
        pagination,
        {
          opacity: 0,
          y: 15,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
        },
        "-=0.1"
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return rootRef;
}
