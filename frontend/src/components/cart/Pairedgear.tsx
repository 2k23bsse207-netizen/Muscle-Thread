import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ShoppingBag } from 'lucide-react';
import { LIME } from '../theme';
import { useReveal } from '../ProductInfo/Usereveal';
import { paired } from './Data';
import { Frame } from './Field';

type Props = { inBag: string[]; onAdd: (id: string) => void };

export default function PairedGear({ inBag, onAdd }: Props) {
  const ref = useReveal<HTMLElement>(0.12);
  const [flash, setFlash] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const add = (id: string) => {
    onAdd(id);
    setFlash(id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(null), 1200);
  };

  return (
    <section ref={ref} id="paired-gear" className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-20">
      <div data-reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <svg viewBox="0 0 62 30" className="h-4 w-auto" fill={LIME} aria-hidden="true">
              <path d="M14 0h20L20 30H0z" />
              <path d="M42 0h20L48 30H28z" />
            </svg>
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-white/80">
              Complete the kit
            </span>
          </div>
          <h2 className="font-display text-4xl font-black italic uppercase leading-[0.9] tracking-tight md:text-6xl">
            <span className="block text-transparent" style={{ WebkitTextStroke: `2px ${LIME}` }}>
              Frequently
            </span>
            <span className="block text-white">paired gear</span>
          </h2>
        </div>
        <Link
          to="/"
          className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 underline-offset-8 transition-colors hover:text-white hover:underline"
        >
          Keep shopping →
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {paired.map((p) => {
          const added = inBag.includes(p.id);
          return (
            <Frame key={p.id} data-reveal glow size={26}>
              <div
                className="relative aspect-[4/3] overflow-hidden"
                style={{ background: `radial-gradient(circle at 50% 100%, ${LIME}22, transparent 62%), linear-gradient(#1d1d1d, #0b0b0b)` }}
              >
                <img
                  src={p.src}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <span
                  className="absolute left-0 top-4 -skew-x-12 py-1.5 pl-5 pr-3 text-[9px] font-black uppercase tracking-widest text-black"
                  style={{ background: LIME }}
                >
                  <span className="block skew-x-12">{p.tag}</span>
                </span>
              </div>

              <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-4">
                <div className="min-w-0">
                  <h3 className="font-display truncate text-base font-bold uppercase italic tracking-tight text-white">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-xs text-white/60">{p.note}</p>
                </div>
                <span className="font-display shrink-0 text-2xl font-black italic leading-none text-white">
                  <span className="mr-0.5 align-top text-xs" style={{ color: LIME }}>$</span>
                  {p.price.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => add(p.id)}
                disabled={added}
                className={`flex w-full items-center justify-center gap-2 py-3.5 text-[10px] font-black uppercase tracking-widest transition ${
                  added ? 'bg-white/10 text-white/70' : 'text-black hover:brightness-110'
                }`}
                style={added ? undefined : { background: LIME }}
              >
                {added ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> {flash === p.id ? 'Added to order' : 'In your bag'}
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-3.5 w-3.5" /> Add to order
                  </>
                )}
              </button>
            </Frame>
          );
        })}
      </div>
    </section>
  );
}