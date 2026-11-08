import TextLoop from './TextLoop'
import { LIME } from '../theme'

const display = "font-['Barlow_Condensed','Oswald',Impact,sans-serif]"

/* skewed square, same motif as the headline period */
const Mark = () => (
  <span aria-hidden="true" className="block h-[0.28em] w-[0.28em] -skew-x-12 bg-current" />
)

export default function MoveMarquee() {
  return (
    <section
      aria-label="MOVE — Move without limits"
      className="relative isolate overflow-hidden bg-[#171914] py-10 sm:py-14"
    >
      {/* dot texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 0.7px, transparent 0.7px)',
          backgroundSize: '8px 8px',
        }}
      />

      <div className="relative h-[84px] sm:h-[112px] lg:h-[132px]">
        {/* Ribbon B — off-white, moves right, sits behind */}
        <div className="absolute left-[-6%] top-1/2 w-[112%] rotate-[1.6deg] -translate-y-1/2 bg-[#F7F4EE] py-1.5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.7)] sm:py-2.5">
          <TextLoop
            text="TRAIN HARDER · MOVE BETTER · LOOK SHARPER"
            separator={<Mark />}
            separatorColor={LIME}
            direction="right"
            speed={60}
            scrollBoost={0.6}
            color="#171914"
            fontSize="clamp(1.25rem, 2.7vw, 2.4rem)"
            fontWeight={800}
            letterSpacing="0.03em"
            pauseOnHover
            className={`${display} italic uppercase`}
          />
        </div>

        {/* Ribbon A — lime, moves left, on top */}
        <div
          className="absolute left-[-6%] top-1/2 z-10 w-[112%] -rotate-[1.6deg] -translate-y-1/2 py-2 shadow-[0_20px_40px_-18px_rgba(0,0,0,0.7)] sm:py-3"
          style={{ backgroundColor: LIME }}
        >
          <TextLoop
            text="MOVE WITHOUT LIMITS"
            separator={<Mark />}
            separatorColor="#171914"
            direction="left"
            speed={85}
            scrollBoost={0.7}
            color="#171914"
            fontSize="clamp(1.6rem, 3.6vw, 3.2rem)"
            fontWeight={900}
            letterSpacing="0.02em"
            pauseOnHover
            className={`${display} italic uppercase`}
          />
        </div>
      </div>
    </section>
  )
}