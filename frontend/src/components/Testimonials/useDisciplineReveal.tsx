import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

export function useDisciplineReveal() {
  const sectionRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const context = gsap.context(() => {
      const eyebrow = section.querySelector('[data-discipline-eyebrow]')
      const words = section.querySelectorAll('[data-discipline-word]')
      const highlight = section.querySelector('[data-discipline-highlight]')
      const accentLine = section.querySelector('[data-discipline-line]')
      const caption = section.querySelector('[data-discipline-caption]')

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reducedMotion) return // everything stays in its final, visible state

      // initial states (set before paint, no flash)
      gsap.set(eyebrow, { y: 20, autoAlpha: 0 })
      gsap.set(words, { yPercent: 110, autoAlpha: 0 })
      gsap.set(highlight, { scaleX: 0, transformOrigin: 'left center' })
      gsap.set(accentLine, { scaleX: 0 })
      gsap.set(caption, { y: 18, autoAlpha: 0 })

      const timeline = gsap.timeline({ paused: true })

      timeline
        .to(eyebrow, { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out' })
        .to(
          words,
          { yPercent: 0, autoAlpha: 1, duration: 0.85, stagger: 0.09, ease: 'power4.out' },
          '-=0.25',
        )
        .to(highlight, { scaleX: 1, duration: 0.6, ease: 'power3.inOut' }, '-=0.4')
        .to(accentLine, { scaleX: 1, duration: 0.65, ease: 'power3.inOut' }, '-=0.3')
        .to(caption, { y: 0, autoAlpha: 1, duration: 0.65, ease: 'power3.out' }, '-=0.3')

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            timeline.play()
            observer.disconnect()
          }
        },
        { threshold: 0.3, rootMargin: '0px 0px -8% 0px' },
      )
      observer.observe(section)

      return () => {
        observer.disconnect()
        timeline.kill()
      }
    }, section)

    return () => context.revert()
  }, [])

  return sectionRef
}