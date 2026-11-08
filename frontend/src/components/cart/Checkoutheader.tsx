import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Check, Lock, Truck } from 'lucide-react';
import { LIME } from '../theme';
import { Frame } from './Field';
import { FREE_SHIP_AT, steps } from './Data';

const pad = (n: number) => String(n).padStart(2, '0');

export default function CheckoutHeader({ step, subtotal }: { step: number; subtotal: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  const pct = Math.min(100, (subtotal / FREE_SHIP_AT) * 100);
  const remaining = Math.max(0, FREE_SHIP_AT - subtotal);

  useEffect(() => {
    gsap.to(barRef.current, { width: `${pct}%`, duration: 0.9, ease: 'power3.out' });
  }, [pct]);

  useEffect(() => {
    gsap.fromTo('.step-dot-active', { scale: 0.7 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.5)' });
  }, [step]);

  return (
    <header className="relative mx-auto max-w-[1280px] px-6 pt-10">
      {/* gateway strip */}
      <div className="checkout-strip flex flex-wrap items-center justify-between gap-3 border-y border-white/10 py-3 text-[10px] font-bold uppercase tracking-[0.2em]">
        <span className="flex items-center gap-3 text-white/80">
          <svg viewBox="0 0 62 30" className="h-3.5 w-auto" fill={LIME} aria-hidden="true">
            <path d="M14 0h20L20 30H0z" />
            <path d="M42 0h20L48 30H28z" />
          </svg>
          Athlete checkout
        </span>
        <span className="flex items-center gap-2 text-white/50">
          <Lock className="h-3 w-3" style={{ color: LIME }} /> 256-bit encrypted
        </span>
      </div>

      {/* stepper */}
      <ol className="my-9 flex items-center">
        {steps.map((s, i) => {
          const done = i < step;
          const active = i === step;
          const last = i === steps.length - 1;
          return (
            <li key={s} className={`step-item flex items-center ${last ? '' : 'flex-1'}`}>
              <div className="flex items-center gap-3">
                <span
                  aria-current={active ? 'step' : undefined}
                  className={`font-display grid h-9 w-9 shrink-0 -skew-x-12 place-items-center border text-xs font-black ${
                    active ? 'step-dot-active border-transparent text-black' : done ? 'text-white' : 'border-white/20 text-white/40'
                  }`}
                  style={{
                    background: active ? LIME : done ? '#0b0b0b' : 'transparent',
                    borderColor: done ? LIME : undefined,
                  }}
                >
                  <span className="skew-x-12">
                    {done ? <Check className="h-4 w-4" style={{ color: LIME }} /> : pad(i + 1)}
                  </span>
                </span>
                <span
                  className={`font-display text-[11px] font-bold uppercase tracking-[0.16em] ${
                    active ? 'text-white' : done ? 'hidden text-white/80 sm:inline' : 'hidden text-white/35 sm:inline'
                  }`}
                >
                  {s}
                </span>
              </div>
              {!last && (
                <span className="relative mx-4 block h-px flex-1 bg-white/15">
                  <span
                    className="absolute inset-y-0 left-0 block transition-all duration-500"
                    style={{ width: done ? '100%' : '0%', background: LIME }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* free shipping progress */}
      <Frame className="progress-card mb-10" size={20} innerClassName="p-5">
        <div className="mb-3 flex items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-wider">
          <span className="flex items-center gap-3 text-white/80">
            <Truck className="h-4 w-4 shrink-0" style={{ color: LIME }} />
            {remaining > 0 ? (
              <span>
                Add <b className="text-white">${remaining.toFixed(2)}</b> more to unlock free shipping
              </span>
            ) : (
              <span style={{ color: LIME }}>Free shipping unlocked</span>
            )}
          </span>
          <span className="font-display shrink-0 italic text-white/50">{Math.round(pct)}%</span>
        </div>
        <div className="h-1.5 bg-white/10">
          <div
            ref={barRef}
            className="h-full w-0 shadow-[0_0_14px_rgba(200,243,29,0.65)]"
            style={{ background: LIME }}
          />
        </div>
      </Frame>
    </header>
  );
}