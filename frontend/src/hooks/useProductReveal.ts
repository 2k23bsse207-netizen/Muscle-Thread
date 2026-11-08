import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll reveals for the product section.
 *
 * - Section chrome (heading, actions, toolbar, count, pagination) reveals
 *   once when the section scrolls into view.
 * - Cards + images re-animate whenever `productsKey` changes, so a new
 *   filter/page of results always staggers in.
 *
 * Honors prefers-reduced-motion; reverts every tween on unmount.
 */
export default function useProductReveal<T extends HTMLElement = HTMLElement>(
  productsKey: string,
) {
  const sectionRef = useRef<T>(null);

  // Section chrome — once, on first scroll into view.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
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

      // Eyebrow + title + intro copy
      tl.fromTo(
        "[data-product-heading]",
        { opacity: 0, y: 45 },
        { opacity: 1, y: 0, duration: 0.8 },
      );

      // Reset / view-all / header pagination cluster
      tl.fromTo(
        "[data-product-actions]",
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.6 },
        "-=0.4",
      );

      // Filter toolbar and result count
      tl.fromTo(
        ["[data-product-toolbar]", "[data-product-count]"],
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 },
        "-=0.3",
      );

      // Bottom pagination reveals against its own trigger (it sits far below
      // the section top, so the section-level trigger would fire too early).
      const pagination = section.querySelector("[data-product-pagination]");
      if (pagination) {
        gsap.fromTo(
          pagination,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: pagination,
              start: "top 92%",
              once: true,
            },
          },
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  // Product cards — re-runs when the visible set changes.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const grid = section.querySelector("[data-product-grid]");
      const cards = section.querySelectorAll("[data-product-card]");

      if (!grid || cards.length === 0) return;

      const trigger = {
        trigger: grid,
        start: "top 85%",
        once: true,
      };

      // Cards rise into place one by one
      gsap.fromTo(
        cards,
        { opacity: 0, y: 65 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: trigger,
        },
      );

      // Refined image transition: subtle settle from a slight zoom
      gsap.fromTo(
        section.querySelectorAll("[data-product-image]"),
        { scale: 1.12 },
        {
          scale: 1,
          duration: 1.1,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: trigger,
        },
      );
    }, section);

    return () => ctx.revert();
  }, [productsKey]);

  return sectionRef;
}
