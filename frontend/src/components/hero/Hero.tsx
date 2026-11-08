import type { CSSProperties } from "react";
import HeroDesktop from "./HeroDesktop";
import HeroMobile from "./HeroMobile";

/**
 * --ab = artboard width (desktop, >= 768px):
 *   never wider than the section, never taller than the viewport
 *   (100svh * 1672/941), and never narrower than 900px.
 * The artwork fills the artboard exactly (same aspect ratio), so it is never
 * cropped, and all headline/text uses the artboard's own coordinate space,
 * so image and text scale as one.
 *
 * Entrance animation lives in useHeroEntrance; variants tag their own nodes
 * with data-hero="bg" | "reveal" | ...
 */
export default function Hero() {
  return (
    <section
      className="relative min-h-svh w-full overflow-hidden bg-black text-white"
      style={
        {
          "--ab": "min(100%, max(calc(100svh * 1672 / 941), 900px))",
        } as CSSProperties
      }
    >
      {/* Header is rendered once by the shared route layout (pages/Layout.tsx) */}

      {/* ===================== MOBILE (< 768px) ===================== */}
      <HeroMobile />

      {/* ===================== DESKTOP / TABLET (>= 768px) ===================== */}
      <HeroDesktop />
    </section>
  );
}