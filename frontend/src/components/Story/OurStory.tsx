import { useEffect, useRef, useState } from 'react'
import { LIME } from '../theme'

/* Same type pairing as ShopByCategory */
const display = "font-['Barlow_Condensed','Oswald',Impact,sans-serif]"
const body = "font-['Inter',system-ui,sans-serif]"

const VIDEO_SRC = '/videos/our-story.mp4' // <- your video
const VIDEO_POSTER = '/images/our-story-athlete.jpg'

const FEATURES = [
  {
    title: 'Fast Worldwide Shipping',
    description: 'Your training essentials, delivered wherever you move.',
    icon: (
      <>
        <path d="M3 7h11v11H3z" />
        <path d="M14 11h4l3 4v3h-7z" />
        <circle cx="7.5" cy="19" r="2" />
        <circle cx="17.5" cy="19" r="2" />
        <path d="M3 10h7M3 13h5" />
      </>
    ),
  },
  {
    title: 'Secure Checkout',
    description: 'Protected payments and a seamless shopping experience.',
    icon: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <path d="m9 15 2 2 4-4" />
      </>
    ),
  },
  {
    title: 'Always Here to Help',
    description: 'Real support whenever you need a hand.',
    icon: (
      <>
        <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
        <rect x="3" y="12" width="4" height="7" rx="2" />
        <rect x="17" y="12" width="4" height="7" rx="2" />
        <path d="M17 19a5 5 0 0 1-5 3h-1" />
        <path d="M11 22h2" />
      </>
    ),
  },
]

const STATS = [
  { value: '01', label: 'One mindset' },
  { value: '100%', label: 'Commitment' },
  { value: '24/7', label: 'Your support' },
]

/* ---------- tiny inline icons ---------- */
const Svg = ({ children, className = 'h-4 w-4' }: { children: React.ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
)
const ArrowIcon = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></Svg>
)
const PlayIcon = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M8 5v14l11-7z" fill="currentColor" /></Svg>
)
const PauseIcon = ({ className }: { className?: string }) => (
  <Svg className={className}><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" /></Svg>
)
const VolumeIcon = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></Svg>
)
const MutedIcon = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="m16 9 5 6" /><path d="m21 9-5 6" /></Svg>
)

export default function OurStory() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const userPaused = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [progress, setProgress] = useState(0)

  /* Play only while visible; never autoplay for reduced-motion users */
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      userPaused.current = true
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !userPaused.current) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      userPaused.current = false
      video.play().catch(() => {})
    } else {
      userPaused.current = true
      video.pause()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  const watchFilm = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = false
    setMuted(false)
    userPaused.current = false
    video.currentTime = 0
    video.play().catch(() => {})
    video.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const onTimeUpdate = () => {
    const video = videoRef.current
    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      setProgress((video.currentTime / video.duration) * 100)
    }
  }

  const glassBtn =
    'flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-md transition-all duration-300 hover:border-transparent hover:text-[#171717] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:h-11 sm:w-11'

  return (
    <section
      id="our-story"
      className={`${body} relative isolate overflow-hidden bg-[#292b25] px-5 py-16 text-[#f5f3ec] sm:px-8 sm:py-20 lg:px-12 lg:py-28`}
    >
      {/* ===== Background ===== */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 0.7px, transparent 0.7px)',
          backgroundSize: '8px 8px',
        }}
      />
      {/* soft lime glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-[0.12] blur-3xl"
        style={{ backgroundColor: LIME }}
      />
      {/* outlined watermark */}
      <span
        aria-hidden="true"
        className={`${display} pointer-events-none absolute left-1/2 top-[34%] -translate-x-1/2 select-none whitespace-nowrap text-[clamp(9rem,30vw,32rem)] font-black italic uppercase leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.05)]`}
      >
        Move
      </span>

      {/* lime stripe artwork */}
      <svg
        aria-hidden="true"
        viewBox="0 0 300 380"
        fill="none"
        className="pointer-events-none absolute right-0 top-0 z-0 h-[270px] w-[210px] sm:h-[350px] sm:w-[275px] lg:h-[440px] lg:w-[340px]"
      >
        <path d="M285 -35L115 380" stroke={LIME} strokeWidth="15" opacity=".95" />
        <path d="M325 -35L155 380" stroke={LIME} strokeWidth="15" opacity=".72" />
        <path d="M365 -35L195 380" stroke={LIME} strokeWidth="15" opacity=".48" />
        <path d="M405 -35L235 380" stroke={LIME} strokeWidth="15" opacity=".25" />
      </svg>

      <div className="relative z-10 mx-auto max-w-[1440px]">
        {/* ===== Section header ===== */}
        <div className="mb-12 flex items-center justify-between border-b border-white/15 pb-5 sm:mb-16">
          <div className="flex items-center gap-3">
            <span className="h-[3px] w-10" style={{ backgroundColor: LIME }} />
            <span
              className={`${display} text-[0.75rem] font-bold italic uppercase tracking-[0.4em] sm:text-sm`}
              style={{ color: LIME }}
            >
              The MOVE Philosophy
            </span>
          </div>
          <span className={`${display} hidden text-xs font-bold italic uppercase tracking-[0.3em] text-white/40 sm:block`}>
            Est. For The Driven
          </span>
        </div>

        {/* ===== Main layout ===== */}
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_1fr] lg:gap-16 xl:gap-24">
          {/* ---------- LEFT: story ---------- */}
          <div className="relative order-2 lg:order-1">
            <p className={`${display} mb-4 text-sm font-bold italic uppercase tracking-[0.35em] text-white/45`}>
              Built for those who
            </p>

            <h2
              className={`${display} text-[clamp(3.4rem,7.6vw,7.5rem)] font-black italic uppercase leading-[0.88] tracking-[-0.01em]`}
            >
              Refuse
              <br />
              <span style={{ color: LIME }}>To Stand</span>
              <br />
              Still
              <span
                aria-hidden="true"
                className="ml-[0.07em] inline-block h-[0.15em] w-[0.15em] -skew-x-12 rounded-[0.03em] bg-white"
              />
            </h2>

            <div className="mt-10 flex items-center gap-3">
              <span className="h-2 w-2" style={{ backgroundColor: LIME }} />
              <span className={`${display} text-xs font-bold italic uppercase tracking-[0.3em] text-white/55`}>
                More Than Activewear
              </span>
            </div>

            <h3
              className={`${display} mt-4 max-w-[560px] text-[clamp(1.9rem,3.2vw,3rem)] font-extrabold italic uppercase leading-[1] tracking-[-0.005em]`}
            >
              Your gear should{' '}
              <span style={{ color: LIME }}>never hold you</span> back.
            </h3>

            <p className="mt-6 max-w-[520px] text-sm leading-7 text-white/75 sm:text-[15px] sm:leading-8">
              MOVE was created for people who never settle. The ones who show up,
              push harder, and keep moving forward. We believe what you wear
              should work as hard as you do.
            </p>

            <p className="mt-4 max-w-[520px] text-sm leading-7 text-white/50 sm:text-[14px]">
              From the first warm-up to the final rep, every piece is designed
              around comfort, freedom of movement, and everyday performance. No
              distractions. Just gear that moves with you.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#move-lab"
                className="group inline-flex items-center gap-5 rounded-full py-1.5 pl-7 pr-1.5 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-[#171717] transition-all duration-300 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-xs"
                style={{ backgroundColor: LIME }}
              >
                Discover Our Story
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171717] transition-transform duration-300 group-hover:translate-x-1" style={{ color: LIME }}>
                  <ArrowIcon className="h-4 w-4" />
                </span>
              </a>

              <button
                type="button"
                onClick={watchFilm}
                className="group inline-flex items-center gap-3 rounded-full border border-white/25 py-1.5 pl-1.5 pr-6 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-white transition-colors duration-300 hover:border-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-xs"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 transition-colors duration-300 group-hover:border-transparent group-hover:text-[#171717]" >
                  <PlayIcon className="h-4 w-4 translate-x-[1px]" />
                </span>
                Watch Film
              </button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid max-w-[520px] grid-cols-3 border-t border-white/15 pt-6 sm:mt-14">
              {STATS.map((stat, index) => (
                <div key={stat.label} className={index > 0 ? 'border-l border-white/15 pl-4 sm:pl-6' : ''}>
                  <p
                    className={`${display} text-[clamp(2rem,3.6vw,3.2rem)] font-black italic leading-none tracking-tight`}
                    style={{ color: LIME }}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.14em] text-white/45 sm:text-[10px]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ---------- RIGHT: video ---------- */}
          <div className="relative order-1 lg:order-2">
            {/* offset lime frame */}
            <span
              aria-hidden="true"
              className="absolute -bottom-3 -left-3 right-6 top-10 rounded-[1.6rem] border-2 opacity-60 sm:-bottom-4 sm:-left-4 sm:rounded-[2.2rem]"
              style={{ borderColor: LIME }}
            />
            {/* shadow layer (kept outside the clip-path) */}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-[1.4rem] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)] sm:rounded-[2rem]"
            />

            <div
              className="group relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-[#1d1e19] ring-1 ring-white/10 sm:aspect-[16/12] sm:rounded-[2rem] lg:aspect-[4/4.7]"
              style={{
                clipPath:
                  'polygon(0 0, calc(100% - 3.5rem) 0, 100% 3.5rem, 100% 100%, 0 100%)',
              }}
            >
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
                poster={VIDEO_POSTER}
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="MOVE brand film: athletes training with focus and determination"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={onTimeUpdate}
              >
                <source src={VIDEO_SRC} type="video/mp4" />
              </video>

              {/* gradients */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/35" />

              {/* top-left chips */}
              <div className="absolute left-4 top-4 z-10 flex items-center gap-2 sm:left-6 sm:top-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ backgroundColor: LIME }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: LIME }} />
                  </span>
                  <span className={`${display} text-[0.7rem] font-bold italic uppercase tracking-[0.22em] text-white sm:text-xs`}>
                    MOVE Film · 01
                  </span>
                </span>
                <span className={`${display} hidden rounded-full border border-white/25 px-3 py-1.5 text-[0.7rem] font-bold italic uppercase tracking-[0.22em] text-white/80 sm:inline-flex sm:text-xs`}>
                  No Limits
                </span>
              </div>

              {/* caption + controls */}
              <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-5 pb-7 sm:p-8 sm:pb-9">
                <div>
                  <p
                    className={`${display} mb-1 text-[0.7rem] font-bold italic uppercase tracking-[0.3em] sm:text-xs`}
                    style={{ color: LIME }}
                  >
                    The MOVE Standard
                  </p>
                  <p className={`${display} text-[clamp(2rem,4vw,3.6rem)] font-black italic uppercase leading-[0.9]`}>
                    Made to Move.
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
                    className={`${glassBtn} hover:bg-[var(--lime)] focus-visible:outline-[var(--lime)]`}
                    style={{ ['--lime' as string]: LIME }}
                  >
                    {muted ? <MutedIcon className="h-4 w-4" /> : <VolumeIcon className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={playing ? 'Pause video' : 'Play video'}
                    className={`${glassBtn} hover:bg-[var(--lime)] focus-visible:outline-[var(--lime)]`}
                    style={{ ['--lime' as string]: LIME }}
                  >
                    {playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4 translate-x-[1px]" />}
                  </button>
                </div>
              </div>

              {/* progress bar */}
              <div className="absolute inset-x-0 bottom-0 z-10 h-[3px] bg-white/15" aria-hidden="true">
                <div
                  className="h-full transition-[width] duration-300 ease-linear"
                  style={{ width: `${progress}%`, backgroundColor: LIME }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===== Service features ===== */}
        <div className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:mt-28">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06] lg:p-6"
            >
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15">
                <span aria-hidden="true" className="absolute inset-0 opacity-10 transition-opacity duration-300 group-hover:opacity-20" style={{ backgroundColor: LIME }} />
                <svg
                  viewBox="0 0 24 24"
                  className="relative h-6 w-6 transition-transform duration-300 group-hover:scale-110"
                  fill="none"
                  stroke={LIME}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {feature.icon}
                </svg>
              </div>

              <div className="min-w-0">
                <h4 className={`${display} text-base font-extrabold italic uppercase tracking-[0.04em] text-white sm:text-lg`}>
                  {feature.title}
                </h4>
                <p className="mt-1 max-w-[230px] text-[11px] leading-5 text-white/50 sm:text-xs">
                  {feature.description}
                </p>
              </div>

              <span className="ml-auto text-lg text-white/20 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white/70" aria-hidden="true">
                →
              </span>
            </div>
          ))}
        </div>

        {/* ===== Bottom brand line ===== */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className={`${display} text-xs font-bold italic uppercase tracking-[0.3em] text-white/30`}>
            MOVE — Move Without Limits
          </p>
          <p className={`${display} text-xs font-bold italic uppercase tracking-[0.3em] text-white/30`}>
            Built for the Next Rep.
          </p>
        </div>
      </div>
    </section>
  )
}