import { useDisciplineReveal } from './useDisciplineReveal'
import { LIME } from '../theme'

const display = "font-['Barlow_Condensed','Oswald',Impact,sans-serif]"
const body = "font-['Inter',system-ui,sans-serif]"

const LINES = [
  ['PAIN', 'IS', 'TEMPORARY.'],
  ['THE', 'DISCIPLINE', 'YOU', 'BUILD'],
  ['IS', 'FOREVER.'],
]

export default function DisciplineSection() {
  const sectionRef = useDisciplineReveal()

  return (
    <section
      ref={sectionRef}
      className={`${body} relative isolate overflow-hidden bg-[#F7F4EE] px-5 py-24 sm:px-8 sm:py-28 lg:py-36`}
    >
      {/* ===== Background ===== */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* dot texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(#171914 0.7px, transparent 0.7px)',
            backgroundSize: '9px 9px',
          }}
        />
        {/* outlined ghost word */}
        <span
          className={`${display} absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[clamp(10rem,34vw,36rem)] font-black italic uppercase leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(23,25,20,0.06)]`}
        >
          Move
        </span>
        {/* slanted slab, left */}
        <div
          className="absolute -left-[6%] top-0 hidden h-full w-[14%] -skew-x-[20deg] sm:block"
          style={{ backgroundColor: LIME, opacity: 0.1 }}
        />
        {/* top-right black corner + lime wedge */}
        <div className="absolute right-0 top-0 h-14 w-14 bg-[#171914] [clip-path:polygon(0_0,100%_0,100%_100%)] sm:h-20 sm:w-20" />
        <div
          className="absolute right-0 top-14 h-10 w-10 [clip-path:polygon(100%_0,100%_100%,0_100%)] sm:top-20 sm:h-14 sm:w-14"
          style={{ backgroundColor: LIME }}
        />
        {/* bottom-left black wedge + lime slab */}
        <div className="absolute bottom-0 left-0 h-14 w-14 bg-[#171914] [clip-path:polygon(0_0,100%_100%,0_100%)] sm:h-20 sm:w-20" />
        <div
          className="absolute bottom-0 left-[4.5rem] h-3 w-20 -skew-x-[35deg] sm:left-24 sm:h-4 sm:w-28"
          style={{ backgroundColor: LIME }}
        />
      </div>

      <div className="mx-auto flex max-w-[1440px] flex-col items-center text-center">
        {/* Eyebrow */}
        <div data-discipline-eyebrow className="mb-8 flex items-center gap-4 sm:mb-12">
          <span className="h-[3px] w-8 sm:w-12" style={{ backgroundColor: LIME }} />
          <span
            className={`${display} text-[0.75rem] font-bold italic uppercase tracking-[0.45em] text-[#171914]/70 sm:text-sm`}
          >
            The MOVE Mindset
          </span>
          <span className="h-[3px] w-8 sm:w-12" style={{ backgroundColor: LIME }} />
        </div>

        {/* Statement */}
        <h2
          aria-label="Pain is temporary. The discipline you build is forever."
          className={`${display} flex flex-col items-center text-[clamp(2.5rem,8.4vw,7.5rem)] font-black italic uppercase leading-[0.9] tracking-[-0.005em] text-[#171914]`}
        >
          {LINES.map((line, lineIndex) => (
            <span
              key={lineIndex}
              className="flex flex-wrap justify-center gap-x-[0.2em] overflow-hidden px-[0.1em] py-[0.02em]"
            >
              {line.map((word, wordIndex) => {
                const isHighlight = word === 'DISCIPLINE'

                return (
                  <span
                    key={`${lineIndex}-${wordIndex}`}
                    data-discipline-word
                    aria-hidden="true"
                    className="inline-block pr-[0.08em]"
                  >
                    {isHighlight ? (
                      <span className="relative inline-block px-[0.14em]">
                        {/* skew on the wrapper, scale animation on the inner block */}
                        <span className="absolute inset-x-0 inset-y-[0.08em] -skew-x-12">
                          <span
                            data-discipline-highlight
                            className="block h-full w-full origin-left"
                            style={{ backgroundColor: LIME }}
                          />
                        </span>
                        <span className="relative">{word}</span>
                      </span>
                    ) : (
                      word
                    )}
                  </span>
                )
              })}
            </span>
          ))}
        </h2>

        {/* Accent line */}
        <div
          data-discipline-line
          className="mt-10 h-[5px] w-24 origin-center rounded-full sm:mt-14 sm:w-32"
          style={{ backgroundColor: LIME }}
        />

        {/* Supporting text */}
        <p
          data-discipline-caption
          className="mt-7 max-w-md text-xs font-medium italic leading-relaxed tracking-wide text-[#171914]/60 sm:text-sm"
        >
          Every rep. Every challenge. Every step forward.
          <span className="block">Build the discipline. Become the difference.</span>
        </p>
      </div>
    </section>
  )
}