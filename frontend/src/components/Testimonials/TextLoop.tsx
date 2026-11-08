import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import gsap from 'gsap'

interface TextLoopProps {
  text: string
  separator?: ReactNode
  separatorColor?: string
  /** pixels per second */
  speed?: number
  direction?: 'left' | 'right'
  /** extra speed while the page is scrolling (0.8 = +80%) */
  scrollBoost?: number
  color?: string
  fontSize?: string | number
  fontWeight?: number
  letterSpacing?: string | number
  pauseOnHover?: boolean
  className?: string
  style?: CSSProperties
}

const MIN_COPIES = 4

export default function TextLoop({
  text,
  separator = '◆',
  separatorColor = '#B8D52E',
  speed = 75,
  direction = 'left',
  scrollBoost = 0.8,
  color = '#FFFFFF',
  fontSize = 'clamp(20px, 2.2vw, 30px)',
  fontWeight = 900,
  letterSpacing = '0.04em',
  pauseOnHover = false,
  className = '',
  style,
}: TextLoopProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [copies, setCopies] = useState(MIN_COPIES)

  useLayoutEffect(() => {
    const root = rootRef.current
    const track = trackRef.current
    if (!root || !track) return

    const unit = track.firstElementChild as HTMLElement | null
    if (!unit) return

    let tween: gsap.core.Tween | undefined
    let scrollTimer: number | undefined
    let hovered = false
    let alive = true
    let lastWidth = 0

    const measure = () => unit.getBoundingClientRect().width

    // make sure the track is always wider than the viewport
    const fit = () => {
      if (!alive) return
      const width = measure()
      if (!width) return
      const needed = Math.max(MIN_COPIES, Math.ceil(root.clientWidth / width) + 2)
      setCopies((current) => (current === needed ? current : needed))
    }

    // (re)build the loop, keeping its current position so nothing jumps
    const play = () => {
      if (!alive) return
      const width = measure()
      if (!width) return

      lastWidth = width
      const progress = tween ? tween.progress() : 0
      tween?.kill()

      const from = direction === 'left' ? 0 : -width
      const to = direction === 'left' ? -width : 0

      gsap.set(track, { x: from })
      tween = gsap.to(track, {
        x: to,
        duration: width / Math.max(speed, 1),
        ease: 'none',
        repeat: -1,
      })
      tween.progress(progress)

      if (hovered) tween.pause()
    }

    const onScroll = () => {
      if (!tween) return
      tween.timeScale(1 + scrollBoost)
      window.clearTimeout(scrollTimer)
      scrollTimer = window.setTimeout(() => tween?.timeScale(1), 150)
    }

    const onEnter = () => {
      hovered = true
      tween?.pause()
    }

    const onLeave = () => {
      hovered = false
      tween?.resume()
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    fit()

    if (!reducedMotion) {
      play()
      window.addEventListener('scroll', onScroll, { passive: true })

      if (pauseOnHover) {
        root.addEventListener('mouseenter', onEnter)
        root.addEventListener('mouseleave', onLeave)
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      fit()
      if (!reducedMotion && Math.abs(measure() - lastWidth) > 0.5) play()
    })
    resizeObserver.observe(root)
    resizeObserver.observe(unit)

    document.fonts.ready.then(() => {
      if (!alive) return
      fit()
      if (!reducedMotion) play()
    })

    return () => {
      alive = false
      window.clearTimeout(scrollTimer)
      window.removeEventListener('scroll', onScroll)
      root.removeEventListener('mouseenter', onEnter)
      root.removeEventListener('mouseleave', onLeave)
      resizeObserver.disconnect()
      tween?.kill()
      gsap.killTweensOf(track)
    }
  }, [speed, direction, scrollBoost, pauseOnHover])

  return (
    <div ref={rootRef} className={`w-full overflow-hidden ${className}`} style={style}>
      <div
        ref={trackRef}
        className="flex w-max items-center whitespace-nowrap will-change-transform"
      >
        {Array.from({ length: copies }, (_, index) => (
          <div
            key={index}
            aria-hidden={index !== 0}
            className="flex shrink-0 items-center"
            style={{ color, fontSize, fontWeight, letterSpacing }}
          >
            <span>{text}</span>
            <span
              aria-hidden="true"
              className="mx-[0.7em] inline-flex items-center"
              style={{ color: separatorColor }}
            >
              {separator}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}