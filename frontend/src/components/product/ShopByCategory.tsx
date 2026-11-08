import type { CSSProperties } from "react";
import useShopByCategoryAnimation from "../../hooks/useShopByCategoryAnimation";



type Category = {
  title: string;
  subtitle: string;
  image: string;
  alt: string;
  position: string;
  tone: "dark" | "light";
  /** 3D tilt applied from lg and up (flat on phones/tablets) */
  tilt: string;
  /** optional chamfered corner, on top of the rounded corners */
  clip?: string;
  /** lime slabs that peek out behind the card */
  accents: string[];
};

const categories: Category[] = [
  {
    title: "MEN",
    subtitle: "Explore Collection",
    image: "/images/men-gymwear.png",
    alt: "Men's gymwear collection",
    position: "center 30%",
    tone: "dark",
    tilt: "rotateY(14deg) skewX(-7deg)",
    accents: [
      "-left-[3%] top-[38%] h-[28%] w-[9%] -skew-y-6",
      "-bottom-[2.5%] left-[4%] h-[6%] w-[72%]",
    ],
  },
  {
    title: "WOMEN",
    subtitle: "Explore Collection",
    image: "/images/women-gymwear.png",
    alt: "Women's gymwear collection",
    position: "center 30%",
    tone: "light",
    tilt: "rotateY(12deg) skewX(-7deg)",
    accents: ["-right-[3%] top-[42%] h-[22%] w-[7%] -skew-y-6"],
  },
  {
    title: "ACCESSORIES",
    subtitle: "Explore Collection",
    image: "/images/gym-accessories.png",
    alt: "Gym accessories collection",
    position: "center",
    tone: "dark",
    tilt: "skewX(-7deg) skewY(-4deg)",
    clip: "polygon(7% 0, 100% 0, 100% 100%, 0 100%, 0 6%)",
    accents: [
      "-right-[4%] top-[40%] h-[38%] w-[9%] skew-y-6",
      "-bottom-[2%] left-[8%] h-[4%] w-[75%]",
    ],
  },
  {
    title: "NEW ARRIVALS",
    subtitle: "Explore Collection",
    image: "/images/new-arrivals.png",
    alt: "New gymwear collection",
    position: "center 30%",
    tone: "dark",
    tilt: "rotateY(16deg) skewX(-7deg)",
    clip: "polygon(0 0, 91% 0, 100% 8%, 100% 100%, 0 100%)",
    accents: [
      "-right-[4%] top-[46%] h-[40%] w-[10%] -skew-y-6",
      "-bottom-[4%] left-[10%] h-[8%] w-[72%] opacity-60 blur-md",
    ],
  },
];

/* ---------- small inline icons (no extra dependency) ---------- */
const ArrowIcon = ({ className = "h-full w-full" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const BoltIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden>
    <polygon points="13 2 4 14 11.5 14 10.5 22 20 10 12.5 10 13 2" />
  </svg>
);

const DumbbellIcon = () => (
  <svg viewBox="0 0 32 20" fill="currentColor" className="h-5 w-8" aria-hidden>
    <rect x="1" y="6" width="4" height="8" rx="1" />
    <rect x="6" y="3" width="4" height="14" rx="1" />
    <rect x="10" y="9" width="12" height="2" />
    <rect x="22" y="3" width="4" height="14" rx="1" />
    <rect x="27" y="6" width="4" height="8" rx="1" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
    <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </svg>
);

const features = [
  { label: "Premium Quality", icon: <BoltIcon /> },
  { label: "Performance Driven", icon: <DumbbellIcon /> },
  { label: "Move Without Limits", icon: <ShieldIcon /> },
];

const display = "font-['Barlow_Condensed','Oswald',Impact,sans-serif]";
const body = "font-['Inter',system-ui,sans-serif]";

const ShopByCategory = () => {
  const sectionRef = useShopByCategoryAnimation<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-[#f7f7f5] px-4 py-14 sm:px-8 sm:py-16 lg:px-14 lg:py-24"
    >
      {/* ================= BACKGROUND DECORATION ================= */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* pale slanted slabs, top-left */}
        <div className="absolute -left-[6%] top-0 h-[34%] w-[22%] -skew-x-[28deg] bg-gradient-to-br from-white to-black/[0.035]" />
        <div className="absolute left-[10%] top-[2%] h-[22%] w-[18%] -skew-x-[28deg] bg-gradient-to-br from-white to-black/[0.025]" />
        {/* lime bar on the left edge */}
        <div className="absolute -left-[1%] top-[13%] hidden h-[12%] w-[4.5%] -skew-x-[26deg] rounded-xl bg-[#c3e03c] sm:block" />
        {/* top-right: faint lime, black corner, lime wedge */}
        <div className="absolute right-[8%] top-0 hidden h-[7%] w-[8%] -skew-x-[30deg] bg-gradient-to-b from-[#c7e34a]/60 to-transparent sm:block" />
        <div className="absolute right-0 top-0 h-[6%] w-[5%] bg-[#0d0d0d] [clip-path:polygon(0_0,100%_0,100%_100%)]" />
        <div className="absolute -right-[1%] top-[24%] hidden h-[10%] w-[10%] bg-[#c3e03c] [clip-path:polygon(45%_0,100%_0,100%_100%,0_100%)] sm:block" />
        {/* bottom-left: black wedge + lime slab */}
        <div className="absolute bottom-0 left-0 h-[9%] w-[7%] bg-[#0d0d0d] [clip-path:polygon(0_0,100%_100%,0_100%)]" />
        <div className="absolute bottom-0 left-[1.5%] h-[5%] w-[9%] -skew-x-[35deg] bg-[#b8d52e]" />
        {/* bottom-right: black shape + lime wedge */}
        <div className="absolute bottom-0 right-0 h-[9%] w-[17%] bg-[#0d0d0d] [clip-path:polygon(25%_0,100%_0,100%_100%,0_100%)]" />
        <div className="absolute bottom-[9%] right-0 h-[7%] w-[4%] bg-[#b8d52e] [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
      </div>

      <div className="relative mx-auto max-w-[1440px]">
        {/* ================= SECTION HEADER ================= */}
        <div
          data-category-heading
          className="relative mb-10 flex flex-col items-center text-center sm:mb-14 lg:mb-16"
        >
          {/* eyebrow */}
          <div className="mb-3 flex items-center gap-4 sm:mb-4">
            <span className="h-[3px] w-12 bg-[#b8d52e] sm:w-20" />
            <span
              className={`${display} text-[0.7rem] font-bold italic uppercase tracking-[0.45em] text-[#111] sm:text-[0.9rem] lg:text-[1.1rem]`}
            >
              Find Your Fit
            </span>
          </div>

          {/* title */}
          <h2
            className={`${display} whitespace-nowrap text-[clamp(2.4rem,7.6vw,7.5rem)] font-black italic uppercase leading-[0.9] tracking-[-0.01em] text-[#111]`}
          >
            Shop By <span className="text-[#b8d52e]">Category</span>
            <span
              aria-hidden
              className="ml-[0.06em] inline-block h-[0.15em] w-[0.15em] -skew-x-12 rounded-[0.03em] bg-[#111]"
            />
          </h2>

          {/* subtitle */}
          <p
            className={`${body} mt-3 max-w-[22rem] text-[0.8rem] italic leading-snug text-black/70 sm:mt-4 sm:max-w-none sm:text-[clamp(0.9rem,1.6vw,1.5rem)]`}
          >
            Everything you need to train harder, move better and look sharper.
          </p>

          {/* VIEW ALL — pill */}
          <a
            data-category-view-all
            href="/collections"
            className={`${body} group mt-6 inline-flex items-center gap-4 rounded-full border-[1.5px] border-[#111] bg-white/60 py-1.5 pl-5 pr-1.5 text-[0.7rem] font-extrabold uppercase tracking-[0.04em] text-[#111] transition-colors duration-300 hover:bg-[#111] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b8d52e] sm:text-xs lg:absolute lg:right-0 lg:top-[58%] lg:mt-0 lg:-translate-y-1/2 lg:py-2 lg:pl-7 lg:pr-2 lg:text-sm`}
          >
            View All
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#b8d52e] p-2 text-[#111] transition-transform duration-300 group-hover:translate-x-1 lg:h-10 lg:w-10 lg:p-2.5">
              <ArrowIcon />
            </span>
          </a>
        </div>

        {/* ================= CATEGORY GRID ================= */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-7">
          {categories.map((category, index) => {
            const isLight = category.tone === "light";

            return (
              <a
                key={category.title}
                data-category-card
                href={`/collections/${category.title.toLowerCase().replaceAll(" ", "-")}`}
                className="group relative block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#b8d52e]"
              >
                {/* hover lift (separate layer so the entrance animation on <a> never conflicts) */}
                <div className="transition-transform duration-500 ease-out [perspective:1400px] group-hover:-translate-y-2 motion-reduce:transform-none">
                  {/* tilt layer — flat on small screens, 3D from lg */}
                  <div
                    className="relative aspect-[3/4] sm:aspect-[10/13] [transform:none] lg:[transform:var(--tilt)]"
                    style={{ "--tilt": category.tilt } as CSSProperties}
                  >
                    {/* lime accents peeking out behind the card */}
                    {category.accents.map((accent) => (
                      <span
                        key={accent}
                        aria-hidden
                        className={`absolute -z-10 rounded-md bg-[#c3e03c] ${accent}`}
                      />
                    ))}

                    {/* card surface */}
                    <div
                      className={`absolute inset-0 overflow-hidden rounded-[1.1rem] sm:rounded-[1.6rem] ${
                        isLight
                          ? "bg-gradient-to-br from-[#f1f1f1] to-[#cdcdcd]"
                          : "bg-[#1b1b1b]"
                      }`}
                      style={category.clip ? { clipPath: category.clip } : undefined}
                    >
                      {/* IMAGE */}
                      <img
                        data-category-image
                        src={category.image}
                        alt={category.alt}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transform-none"
                        style={{ objectPosition: category.position }}
                      />

                      {/* OVERLAY — strong at the bottom for the title */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent transition-opacity duration-500 group-hover:from-black/95" />

                      {/* NUMBER  01 / 04 */}
                      <div
                        className={`${display} absolute left-[9%] top-[8%] z-10 text-[0.75rem] font-bold italic tracking-wide sm:text-[0.9rem] lg:text-[clamp(0.85rem,1.15vw,1.1rem)]`}
                      >
                        <span className={isLight ? "text-[#111]" : "text-[#b8d52e]"}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className={isLight ? "text-black/45" : "text-white/70"}>
                          {" "}
                          / {String(categories.length).padStart(2, "0")}
                        </span>
                      </div>

                      {/* CONTENT */}
                      <div className="absolute inset-x-0 bottom-0 z-10 px-[8%] pb-[9%]">
                        <h3
                          className={`${display} break-words text-[clamp(1.35rem,3.2vw,3.1rem)] font-extrabold italic uppercase leading-[0.95] tracking-[-0.005em] text-white`}
                        >
                          {category.title}
                        </h3>

                        <div className="mt-2 flex items-center gap-2 sm:mt-3 sm:gap-3">
                          <span
                            className={`${body} flex items-center gap-1 text-[0.6rem] text-white/90 sm:text-[0.75rem] lg:text-[clamp(0.7rem,1.05vw,1rem)]`}
                          >
                            {category.subtitle}
                            <span aria-hidden>→</span>
                          </span>

                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#b8d52e] p-1.5 text-[#111] transition-transform duration-300 group-hover:translate-x-1 sm:h-8 sm:w-8 sm:p-2 lg:h-9 lg:w-9">
                            <ArrowIcon />
                          </span>
                        </div>
                      </div>

                      {/* HOVER OUTLINE */}
                      <div className="pointer-events-none absolute inset-0 rounded-[inherit] border-2 border-transparent transition-colors duration-300 group-hover:border-[#b8d52e]/70" />
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* ================= FEATURE STRIP ================= */}
        <ul
          className={`${body} mx-auto mt-14 flex flex-col items-center gap-4 sm:mt-16 sm:flex-row sm:justify-center sm:gap-0 lg:mt-20`}
        >
          {features.map((feature, i) => (
            <li
              key={feature.label}
              className={`flex items-center gap-3 text-[#111] sm:px-8 lg:px-14 ${
                i > 0 ? "sm:border-l sm:border-black/25" : ""
              }`}
            >
              {feature.icon}
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-black/75 sm:text-[0.7rem]">
                {feature.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default ShopByCategory;