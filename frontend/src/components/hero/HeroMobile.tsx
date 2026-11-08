import { LIME } from "../theme";
import useHeroEntrance from "../../hooks/useHeroEntrance";

export default function HeroMobile() {
  const rootRef = useHeroEntrance();

  return (
    <div
      ref={rootRef}
      className="relative flex min-h-svh w-full flex-col justify-between overflow-hidden bg-black md:hidden"
    >
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden" data-hero="bg">
        {/* Use a dark artwork on mobile too (swap for a dedicated portrait crop if you have one) */}
        <img
          src="/images/hero2.png"
          alt="Gymwear athletic performance sportswear"
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-[62%_center] sm:object-[58%_center]"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 flex flex-col px-5 pb-4 pt-20 sm:px-7 sm:pt-24">
        <div className="max-w-[62%] sm:max-w-[55%]">
          <div className="flex items-center gap-2" data-hero="reveal">
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white sm:text-[11px]">
              TRAIN &nbsp;•&nbsp; PERFORM &nbsp;•&nbsp; EVOLVE
            </span>
            <span className="h-[2px] w-7 shrink-0 sm:w-9" style={{ background: LIME }} />
          </div>

          <h1 className="font-display mt-2 select-none text-[clamp(2.5rem,10.8vw,3.8rem)] font-black italic uppercase leading-[0.88] tracking-tight sm:mt-3">
            <span
              className="block text-transparent"
              style={{ WebkitTextStroke: `1.5px ${LIME}` }}
              data-hero="reveal"
            >
              MOVE
            </span>
            <span className="block text-white" data-hero="reveal">WITHOUT</span>
            <span className="block text-white" data-hero="reveal">LIMITS</span>
          </h1>

          <p
            className="font-body mt-2.5 text-xs font-normal leading-relaxed text-white/90 sm:mt-3 sm:text-sm"
            data-hero="reveal"
          >
            Engineered for every rep. Designed for everything beyond.
          </p>

          <div className="mt-4 sm:mt-5" data-hero="reveal">
            <a
              href="#collections"
              className="font-display group inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-md transition-all hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:scale-95 sm:px-5 sm:py-3 sm:text-sm"
              style={{ background: LIME }}
            >
              <span>SHOP COLLECTION</span>
              <span className="text-sm font-bold transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>

          <div className="mt-3 sm:mt-4" data-hero="reveal">
            <button
              type="button"
              className="group inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/10 transition-transform group-hover:scale-105 sm:h-9 sm:w-9">
                <svg viewBox="0 0 24 24" className="h-3 w-3 translate-x-0.5 fill-white sm:h-3.5 sm:w-3.5" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="font-display text-[11px] font-bold tracking-widest text-white sm:text-xs">
                WATCH VIDEO
              </span>
            </button>
          </div>

          <div className="font-display mt-5 flex flex-col items-start sm:mt-7" data-hero="reveal">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-white">01</span>
              <span className="my-1.5 h-6 w-px bg-white/40" />
              <span className="text-xs font-medium text-white/40">04</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 pb-2" data-hero="reveal">
            <span className="h-2 w-2 rounded-full" style={{ background: LIME }} />
            <span className="h-2 w-2 rounded-full bg-white/30" />
            <span className="h-2 w-2 rounded-full bg-white/30" />
            <span className="h-2 w-2 rounded-full bg-white/30" />
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full border-t border-white/10 bg-[#0d0d0d] px-3 py-3.5 text-white sm:px-6 sm:py-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 24 24" className="mb-1 h-4 w-4 text-white/90 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span className="font-display text-[9px] font-bold uppercase tracking-wider text-white sm:text-xs">Free Shipping</span>
            <span className="text-[8px] text-white/50 sm:text-[10px]">Worldwide</span>
          </div>

          <div className="flex flex-col items-center border-x border-white/10 px-1">
            <svg viewBox="0 0 24 24" className="mb-1 h-4 w-4 text-white/90 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span className="font-display text-[9px] font-bold uppercase tracking-wider text-white sm:text-xs">Secure Payments</span>
            <span className="text-[8px] text-white/50 sm:text-[10px]">100% Secure</span>
          </div>

          <div className="flex flex-col items-center">
            <svg viewBox="0 0 24 24" className="mb-1 h-4 w-4 text-white/90 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0-2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
            <span className="font-display text-[9px] font-bold uppercase tracking-wider text-white sm:text-xs">24/7 Support</span>
            <span className="text-[8px] text-white/50 sm:text-[10px]">Always Here</span>
          </div>
        </div>
      </div>
    </div>
  );
}