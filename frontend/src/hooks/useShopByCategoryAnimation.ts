import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function useShopByCategoryAnimation<T extends HTMLElement = HTMLElement>() {
  const sectionRef = useRef<T>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const heading = section.querySelector("[data-category-heading]");
      const cards = section.querySelectorAll("[data-category-card]");
      const images = section.querySelectorAll("[data-category-image]");
      const viewAll = section.querySelector("[data-category-view-all]");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          once: true,
        },
        defaults: {
          ease: "power3.out",
        },
      });

      // Section heading
      tl.fromTo(
        heading,
        {
          opacity: 0,
          y: 45,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
        }
      );

      // View all link
      tl.fromTo(
        viewAll,
        {
          opacity: 0,
          x: 20,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
        },
        "-=0.4"
      );

      // Category cards appear one by one
      tl.fromTo(
        cards,
        {
          opacity: 0,
          y: 65,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.16,
        },
        "-=0.2"
      );

      // Subtle image reveal
      gsap.fromTo(
        images,
        {
          scale: 1.12,
        },
        {
          scale: 1,
          duration: 1.2,
          stagger: 0.16,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return sectionRef;
}