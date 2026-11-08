import { LIME } from "../theme";
import useHeroEntrance from "../../hooks/useHeroEntrance";

const IMG = "url(/images/hero_updated.png)";
const WHITE = "#f5f5f5";

/**
 * The headline is drawn in SVG using the artboard's own pixel grid
 * (viewBox 1672 x 941 = the artwork size). `textLength` forces every word to
 * span an exact width, so:
 *   - MOVE (neon outline) always fills the gap between the left edge and the
 *     athlete's torso,
 *   - WITHOUT / LIMITS always fill the right-hand block,
 * regardless of which display font loads or how wide the viewport is.
 */
export default function HeroDesktop() {
  const rootRef = useHeroEntrance();

  return (
    <div ref={rootRef} className="relative hidden min-h-svh overflow-hidden bg-black md:block">
      {/* Side fillers: stretch the edge pixels so wide screens stay black */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-0"
        data-hero="bg"
        style={{
          width: "calc((100% - var(--ab)) / 2 + 1px)",
          backgroundImage: IMG,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "left center",
          backgroundSize: "4000% 100%",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-0"
        data-hero="bg"
        style={{
          width: "calc((100% - var(--ab)) / 2 + 1px)",
          backgroundImage: IMG,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right center",
          backgroundSize: "4000% 100%",
        }}
      />

      {/* ARTBOARD */}
      <div
        className="relative mx-auto aspect-[1672/941] w-[var(--ab)]"
        style={{ containerType: "inline-size" }}
      >
        {/* Background image */}
        <img
          src="/images/hero_updated.png"
          alt="Gymwear athletic campaign hero athlete"
          width={1672}
          height={941}
          fetchPriority="high"
          decoding="async"
          draggable={false}
          className="absolute inset-0 z-0 block h-full w-full select-none"
          style={{
            // Melt the bottom edge into the black fill below the artwork
            WebkitMaskImage: "linear-gradient(to bottom, #000 90%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, #000 90%, transparent 100%)",
          }}
          data-hero="bg"
        />

        {/* VERTICAL LEFT RAIL */}
        <div
          className="absolute left-[4%] top-[17%] z-20 flex -translate-x-1/2 flex-col items-center"
          data-hero="rail"
        >
          <span
            className="block"
            style={{
              height: "5.5cqw",
              width: "max(2px, 0.2cqw)",
              background: LIME,
            }}
          />

          <div
            className="font-display flex flex-col items-center font-medium uppercase text-white"
            style={{
              marginTop: "1.2cqw",
              gap: "1cqw",
              fontSize: "max(10px, 0.8cqw)",
              letterSpacing: "0.3em",
            }}
          >
            <span style={{ writingMode: "vertical-rl" }}>Performance</span>
            <span className="block w-px bg-white/50" style={{ height: "1.5cqw" }} />
            <span style={{ writingMode: "vertical-rl" }}>Style</span>
            <span className="block w-px bg-white/50" style={{ height: "1.5cqw" }} />
            <span style={{ writingMode: "vertical-rl" }}>Strength</span>
          </div>
        </div>

        {/* HEADLINE */}
        <h1 className="pointer-events-none absolute inset-0 z-10 m-0 select-none">
          <span className="sr-only">Move Without Limits</span>

          <svg
            viewBox="0 0 1672 941"
            className="font-display absolute inset-0 h-full w-full"
            aria-hidden="true"
            style={{ overflow: "visible" }}
          >
            {/* MOVE: neon outline, spans x 175 -> 810 */}
            <g data-hero="move">
              <text
                x="175"
                y="525"
                fontSize="205"
                fontWeight="900"
                fontStyle="italic"
                textLength="635"
                lengthAdjust="spacingAndGlyphs"
                fill="none"
                stroke={LIME}
                strokeWidth="2.5"
                strokeLinejoin="round"
              >
                MOVE
              </text>
            </g>

            {/* WITHOUT LIMITS: solid white, spans x 880 -> 1520 */}
            <g data-hero="headline">
              <text
                x="905"
                y="478"
                fontSize="128"
                fontWeight="900"
                fontStyle="italic"
                textLength="615"
                lengthAdjust="spacingAndGlyphs"
                fill={WHITE}
              >
                WITHOUT
              </text>
              <text
                x="880"
                y="607"
                fontSize="156"
                fontWeight="900"
                fontStyle="italic"
                textLength="620"
                lengthAdjust="spacingAndGlyphs"
                fill={WHITE}
              >
                LIMITS
              </text>
            </g>
          </svg>
        </h1>

        {/* TAGLINE */}
        <div className="absolute left-[52.2%] top-[75%] z-20">
          <p
            className="font-body border-l font-normal leading-snug text-white"
            style={{
              borderColor: LIME,
              borderLeftWidth: "max(2px, 0.25cqw)",
              paddingLeft: "1.2cqw",
              fontSize: "max(12px, 1.4cqw)",
            }}
            data-hero="tagline"
          >
            Engineered for every rep.
            <br />
            Designed for everything beyond.
          </p>
        </div>

        {/* CTA */}
        <a
          href="#collections"
          className="font-display group absolute left-[52.2%] top-[87%] z-20 inline-flex items-center font-medium uppercase text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          style={{
            gap: "1cqw",
            fontSize: "max(11px, 1.05cqw)",
            letterSpacing: "0.22em",
          }}
          data-hero="cta"
        >
          <span
            className="border-b-2 pb-1 transition-colors group-hover:border-white"
            style={{ borderColor: LIME }}
          >
            Explore the Collection
          </span>
          <svg
            viewBox="0 0 24 24"
            className="transition-transform group-hover:translate-x-1.5"
            style={{ width: "max(14px, 1.3cqw)", height: "max(14px, 1.3cqw)" }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>

        {/* FEATURE CARD (a little above the bottom edge) */}
        {/* <a
          href="#collections"
          aria-label="Shop the featured look"
          className="group absolute z-20 block overflow-hidden"
          style={{
            right: "3.2%",
            bottom: "6.5%",
            width: "14.5cqw",
            aspectRatio: "274 / 306",
            border: "1px solid rgba(255,255,255,0.18)",
            clipPath: "polygon(8% 0, 100% 0, 100% 100%, 0 100%, 0 14%)",
            background: "#0b0b0b",
          }}
          data-hero="card"
        >
          <img
            src="/images/hero_card.png"
            alt="Athlete wearing the new collection"
            draggable={false}
            className="h-full w-full select-none object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span
            className="absolute bottom-0 right-0 flex items-center justify-center text-black"
            style={{ width: "3.2cqw", height: "3.2cqw", background: LIME }}
          >
            <svg
              viewBox="0 0 24 24"
              style={{ width: "1.5cqw", height: "1.5cqw" }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 17L17 7M8 7h9v9" />
            </svg>
          </span>
        </a> */}

        {/* PAGINATION */}
        <div
          className="font-display absolute bottom-[5%] left-[3.3%] z-20 flex items-center text-white"
          style={{ gap: "1cqw" }}
          data-hero="pagination"
        >
          <span className="font-bold" style={{ fontSize: "max(14px, 1.7cqw)" }}>
            01
          </span>
          <span className="relative block h-px bg-white/30" style={{ width: "5cqw" }}>
            <span
              className="absolute inset-y-0 left-0 block"
              style={{ width: "50%", background: LIME }}
            />
          </span>
          <span className="font-medium text-white/40" style={{ fontSize: "max(11px, 1.2cqw)" }}>
            03
          </span>
        </div>
      </div>
    </div>
  );
}