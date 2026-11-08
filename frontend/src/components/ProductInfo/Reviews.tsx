import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { LIME, product, reviewList, stats } from './Data';
import { Frame, Heading, Stars } from './Ui';
import { useReveal } from './Usereveal';

export default function Reviews() {
  const ref = useReveal<HTMLElement>(0.1);
  const barsRef = useRef<HTMLElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const rating = Number(product.rating);

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (scoreRef.current) scoreRef.current.textContent = rating.toFixed(1);
    if (reduce) return;

    const ctx = gsap.context(() => {
      const st = { trigger: barsRef.current, start: 'top 85%', once: true };
      gsap.from('.stat-fill', { scaleX: 0, transformOrigin: 'left', duration: 1.1, ease: 'power3.out', stagger: 0.12, scrollTrigger: st });

      const n = { v: 0 };
      gsap.to(n, {
        v: rating,
        duration: 1.4,
        ease: 'power2.out',
        scrollTrigger: st,
        onUpdate: () => {
          if (scoreRef.current) scoreRef.current.textContent = n.v.toFixed(1);
        },
      });
    }, barsRef);
    return () => ctx.revert();
  }, [rating]);

  return (
    <section ref={ref} id="reviews" className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16 md:py-24">
      <div data-reveal className="mb-12">
        <Heading kicker="Customer reviews" outline="Athlete" solid="reviews" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside ref={barsRef} data-reveal className="h-fit">
          <Frame size={26} innerClassName="p-6">
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Overall rating</span>
            <p className="font-display mt-2 text-7xl font-black italic leading-none text-white">
              <span ref={scoreRef}>{rating.toFixed(1)}</span>
              <span className="text-xl text-white/40"> / 5.0</span>
            </p>
            <div className="my-3">
              <Stars value={rating} className="h-4 w-4" />
            </div>
            <p className="text-[11px] text-white/50">Based on {product.reviews} verified purchases</p>

            <div className="mt-7 space-y-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="mb-1.5 flex justify-between text-[10px] font-bold uppercase tracking-wider text-white">
                    <span>{s.label}</span>
                    <span className="text-white/60">
                      {s.pct}% {s.tag}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10">
                    <div className="stat-fill h-full" style={{ width: `${s.pct}%`, background: LIME }} />
                  </div>
                </div>
              ))}
            </div>
          </Frame>
        </aside>

        <div className="flex flex-col gap-5">
          {reviewList.map((r) => {
            const stars = (r as { rating?: number }).rating ?? 5;
            return (
              <Frame key={r.name} data-reveal glow size={22} innerClassName="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="font-display grid h-10 w-10 shrink-0 -skew-x-12 place-items-center text-sm font-black text-black"
                      style={{ background: LIME }}
                    >
                      <span className="skew-x-12">{r.name.charAt(0)}</span>
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-white">{r.name}</p>
                      <p className="text-[11px] text-white/50">{r.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-white/40">{r.when}</p>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-wider" style={{ color: LIME }}>
                      ✓ Verified buyer
                    </p>
                  </div>
                </div>

                <div className="mb-2 mt-4">
                  <Stars value={stars} className="h-3 w-3" />
                </div>
                <h3 className="font-display text-base font-bold italic text-white">{r.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{r.body}</p>
              </Frame>
            );
          })}
        </div>
      </div>
    </section>
  );
}