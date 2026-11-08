import type { CSSProperties, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { LIME } from '../theme';

export const label = 'font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white/60';

/** Slashed corners (top-right + bottom-left): the shape used on the hero card and product cards. */
export const cut = (px: number) =>
  `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, ${px}px 100%, 0 calc(100% - ${px}px))`;

type FrameProps = HTMLAttributes<HTMLDivElement> & {
  size?: number;
  glow?: boolean;
  innerClassName?: string;
  children: ReactNode;
};

/** Slashed card with a hairline gradient border. `glow` fades the border to neon on hover. */
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

type FieldProps = { title: string; icon?: ReactNode } & InputHTMLAttributes<HTMLInputElement>;

export function Field({ title, icon, className = '', ...rest }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className={label}>{title}</span>
      <span className="relative mt-2 block">
        <input
          {...rest}
          className="w-full border border-white/15 bg-white/[0.04] px-4 py-3.5 text-sm font-medium text-white outline-none transition-colors [color-scheme:dark] placeholder:text-white/25 hover:border-white/30 focus:border-[color:var(--lime)] focus:bg-white/[0.07]"
          style={{ '--lime': LIME } as CSSProperties}
        />
        {icon && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40">{icon}</span>
        )}
      </span>
    </label>
  );
}

type PanelProps = { title: string; tag?: string; index?: string; children: ReactNode };

export function Panel({ title, tag, index, children }: PanelProps) {
  return (
    <section data-reveal>
      <Frame size={28} innerClassName="p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {index && (
              <span
                className="font-display grid h-9 w-9 shrink-0 -skew-x-12 place-items-center text-xs font-black text-black"
                style={{ background: LIME }}
              >
                <span className="skew-x-12">{index}</span>
              </span>
            )}
            <h2 className="font-display text-2xl font-black italic uppercase tracking-tight text-white md:text-3xl">
              {title}
            </h2>
          </div>
          {tag && (
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{tag}</span>
          )}
        </div>
        {children}
      </Frame>
    </section>
  );
}