import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { LIME } from '../../theme';

export const card =
  'rounded-2xl border border-black/[0.07] bg-white shadow-[0_2px_12px_rgba(20,24,18,0.03)] transition-all duration-300';

export const kicker =
  'text-[10px] font-bold uppercase tracking-[0.18em] text-[#171914]/45';

export function PageHeader({
  title,
  sub,
  badge,
  children,
}: {
  title: string;
  sub: string;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-black italic uppercase tracking-tight text-[#171914] sm:text-4xl">
            {title}
          </h1>
          {badge && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-black"
              style={{ background: LIME }}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1.5 max-w-xl text-xs font-medium leading-relaxed text-[#171914]/55 sm:text-[13px]">
          {sub}
        </p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  );
}

export function Toggle({
  on,
  onChange,
  label,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  const knob = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.to(knob.current, {
      x: on ? 18 : 2,
      duration: 0.25,
      ease: 'power3.out',
    });
  }, [on]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        background: on ? LIME : '#E5E2D9',
      }}
    >
      <span
        ref={knob}
        className="block h-5 w-5 rounded-full bg-[#171914] shadow-sm transition-transform"
      />
    </button>
  );
}
