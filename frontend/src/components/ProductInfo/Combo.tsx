import { useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Check, Plus } from 'lucide-react';
import { LIME, combo } from './Data';
import { Frame, Heading, dots } from './Ui';
import { useReveal } from './Usereveal';

type ComboItem = (typeof combo)[number];

/** `onAddKit` receives the selected items. The button only renders when it is provided. */
export default function Combo({ onAddKit }: { onAddKit?: (items: ComboItem[]) => void }) {
  const ref = useReveal<HTMLElement>(0.12);
  const totalRef = useRef<HTMLElement>(null);
  const [picked, setPicked] = useState<string[]>(combo.map((c) => c.name));

  const selected = useMemo(() => combo.filter((c) => picked.includes(c.name)), [picked]);
  const total = selected.reduce((sum, c) => sum + c.price, 0);

  const toggle = (name: string, locked?: boolean) => {
    if (locked) return;
    setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));
    gsap.fromTo(totalRef.current, { y: -8, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
  };

  return (
    <section ref={ref} className="mx-auto max-w-[1280px] px-6 py-16 md:py-24">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div data-reveal>
          <Heading kicker="Complete the uniform" outline="Training" solid="combo" />
        </div>

        <div data-reveal className="flex items-center gap-5 border border-white/15 bg-white/[0.04] p-2 pl-5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">Bundle price</p>
            <b ref={totalRef} className="font-display inline-block text-2xl font-black italic text-white">
              <span className="mr-0.5 text-sm" style={{ color: LIME }}>$</span>
              {total.toFixed(2)}
            </b>
          </div>
          {onAddKit && (
            <button
              onClick={() => onAddKit(selected)}
              disabled={selected.length === 0}
              className="-skew-x-12 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-black transition hover:brightness-110 disabled:opacity-40"
              style={{ background: LIME }}
            >
              <span className="block skew-x-12">Add kit to bag</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {combo.map((c) => {
          const on = picked.includes(c.name);
          return (
            <Frame
              key={c.name}
              data-reveal
              glow
              size={26}
              className={`transition-opacity duration-300 ${on ? '' : 'opacity-55'}`}
            >
              <div
                className="relative aspect-[4/3] overflow-hidden"
                style={{ background: `radial-gradient(circle at 50% 100%, ${LIME}22, transparent 62%), linear-gradient(#1d1d1d, #0b0b0b)` }}
              >
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60" style={dots(16)} />
                <img
                  src={c.src}
                  alt={c.name}
                  className="relative h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>

              <div className="flex items-end justify-between gap-3 p-5">
                <div className="min-w-0">
                  <h3 className="font-display truncate text-base font-bold uppercase italic text-white">{c.name}</h3>
                  <p className="mt-1 text-xs text-white/60">{c.note}</p>
                  <p className="font-display mt-3 text-2xl font-black italic text-white">
                    <span className="mr-0.5 text-xs" style={{ color: LIME }}>$</span>
                    {c.price.toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => toggle(c.name, c.locked)}
                  aria-pressed={on}
                  disabled={c.locked}
                  className={`-skew-x-12 flex shrink-0 items-center border px-3.5 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                    on ? 'border-transparent text-black' : 'border-white/30 text-white hover:border-white'
                  }`}
                  style={on ? { background: LIME } : undefined}
                >
                  <span className="flex skew-x-12 items-center gap-1.5">
                    {on ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {c.locked ? 'Included' : on ? 'Added' : 'Add'}
                  </span>
                </button>
              </div>
            </Frame>
          );
        })}
      </div>
    </section>
  );
}