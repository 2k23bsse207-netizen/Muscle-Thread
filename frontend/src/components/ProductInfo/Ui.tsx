import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { Star } from 'lucide-react';
import { LIME } from './Data';

/** Slashed corners (top-right + bottom-left) - same shape as the hero card and product cards. */
export const cut = (px: number) =>
  `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, ${px}px 100%, 0 calc(100% - ${px}px))`;

/** The hero's dot grid as a background. */
export const dots = (size = 18, alpha = 0.18): CSSProperties => ({
  backgroundImage: `radial-gradient(rgba(255,255,255,${alpha}) 1px, transparent 1.3px)`,
  backgroundSize: `${size}px ${size}px`,
});

type FrameProps = HTMLAttributes<HTMLDivElement> & {
  size?: number;
  glow?: boolean;
  innerClassName?: string;
  children: ReactNode;
};

/** Slashed card with a hairline border; `glow` fades the border to neon on hover. */
export function Frame({ size = 22, glow = false, innerClassName = '', className = '', children, ...rest }: FrameProps) {
  return (
    <div
      {...rest}
      className={`group relative p-px ${className}`}
      style={{
        clipPath: cut(size),
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.26), rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.12))',
      }}
    >
      {glow && (
        <span
          aria-hidden="true"
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `linear-gradient(135deg, ${LIME}, rgba(0,0,0,0) 55%, ${LIME})` }}
        />
      )}
      <div className={`relative h-full bg-[#0b0b0b] ${innerClassName}`} style={{ clipPath: cut(size - 1) }}>
        {children}
      </div>
    </div>
  );
}

/** Section heading: logo-slash eyebrow + neon outline line + solid white line (mirrors the hero). */
export function Heading({ kicker, outline, solid }: { kicker: string; outline: string; solid: string }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <svg viewBox="0 0 62 30" className="h-4 w-auto" fill={LIME} aria-hidden="true">
          <path d="M14 0h20L20 30H0z" />
          <path d="M42 0h20L48 30H28z" />
        </svg>
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-white/80">{kicker}</span>
      </div>
      <h2 className="font-display text-5xl font-black uppercase italic leading-[0.9] tracking-tight md:text-7xl">
        <span className="block text-transparent" style={{ WebkitTextStroke: `2px ${LIME}` }}>
          {outline}
        </span>
        <span className="block text-white">{solid}</span>
      </h2>
    </div>
  );
}

export function Stars({ value, className = 'h-3.5 w-3.5' }: { value: number; className?: string }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={className}
          fill={i < Math.round(value) ? LIME : 'none'}
          stroke={i < Math.round(value) ? LIME : 'rgba(255,255,255,0.3)'}
        />
      ))}
    </div>
  );
}