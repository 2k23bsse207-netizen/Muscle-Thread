import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Plus, Zap } from 'lucide-react';
import { LIME, product } from './Data';
import { Stars } from './Ui';

type Selection = { color: string; size: string };

const label = 'font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white/60';

function Accordion({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left font-display text-[12px] font-bold uppercase tracking-[0.18em] text-white"
      >
        {title}
        <Plus
          className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
          style={{ color: LIME }}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-4 text-sm leading-relaxed text-white/60">{body}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProductInfo({
  onAdd,
  onBuyNow,
}: {
  onAdd: (item: Selection) => void;
  onBuyNow: (item: Selection) => void;
}) {
  const [color, setColor] = useState(0);
  const [size, setSize] = useState('M');
  const [added, setAdded] = useState(false);
  const fillRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const selection = (): Selection => ({ color: product.colors[color].name, size });
  const hasDiscount = product.was > product.price;
  const save = hasDiscount ? Math.round((1 - product.price / product.was) * 100) : 0;

  const add = () => {
    onAdd(selection());
    setAdded(true);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.fromTo(fillRef.current, { scaleX: 0 }, { scaleX: 1, duration: reduce ? 0 : 0.45, ease: 'power3.inOut' });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setAdded(false);
      gsap.set(fillRef.current, { scaleX: 0 });
    }, 1600);
  };

  return (
    <div className="flex flex-col gap-7">
      {/* TITLE + PRICE */}
      <div>
        <div className="flex items-center gap-3">
          <Stars value={Number(product.rating)} />
          <a href="#reviews" className="text-[11px] font-bold text-white/70 underline-offset-4 hover:underline">
            {product.rating} · {product.reviews} reviews
          </a>
        </div>

        <h1 className="font-display mt-4 text-5xl font-black italic uppercase leading-[0.92] tracking-tight text-white md:text-6xl">
          {product.name}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <span className="font-display text-4xl font-black italic leading-none text-white">
            <span className="mr-1 align-top text-xl" style={{ color: LIME }}>$</span>
            {product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-base text-white/40 line-through">${product.was.toFixed(2)}</span>
              <span
                className="-skew-x-12 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black"
                style={{ background: LIME }}
              >
                <span className="block skew-x-12">Save {save}%</span>
              </span>
            </>
          )}
        </div>

        <p className="mt-5 max-w-md border-l-2 pl-4 text-sm leading-relaxed text-white/70" style={{ borderColor: LIME }}>
          {product.desc}
        </p>
      </div>

      {/* COLOUR */}
      <div>
        <div className="mb-3 flex justify-between">
          <span className={label}>Colorway</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white">{product.colors[color].name}</span>
        </div>
        <div className="flex gap-3.5">
          {product.colors.map((c, i) => (
            <button
              key={c.name}
              onClick={() => setColor(i)}
              aria-label={c.name}
              aria-pressed={i === color}
              className="h-8 w-8 rounded-full border border-white/25 transition-transform hover:scale-110"
              style={{
                background: c.hex,
                boxShadow: i === color ? `0 0 0 2px #000, 0 0 0 4px ${LIME}` : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* SIZE */}
      <div>
        <div className="mb-3">
          <span className={label}>Size</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {product.sizes.map((s) => {
            const on = s === size;
            return (
              <button
                key={s}
                onClick={() => setSize(s)}
                aria-pressed={on}
                className={`-skew-x-12 border py-3 text-xs font-black transition-colors ${
                  on ? 'border-transparent text-black' : 'border-white/20 text-white/80 hover:border-white/60 hover:text-white'
                }`}
                style={on ? { background: LIME } : undefined}
              >
                <span className="block skew-x-12">{s}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <button
          onClick={add}
          className="relative -skew-x-12 overflow-hidden py-4 text-xs font-black uppercase tracking-widest text-black transition hover:brightness-110"
          style={{ background: LIME }}
        >
          <span ref={fillRef} className="absolute inset-0 origin-left scale-x-0 bg-black" />
          <span
            className={`relative flex skew-x-12 items-center justify-center gap-2 transition-colors ${
              added ? 'text-white' : ''
            }`}
          >
            <Zap className="h-4 w-4" />
            {added ? 'Added to bag' : `Add to bag – $${product.price.toFixed(2)}`}
          </span>
        </button>

        <button
          onClick={() => onBuyNow(selection())}
          className="-skew-x-12 bg-white px-8 text-xs font-black uppercase tracking-widest text-black transition hover:brightness-90"
        >
          <span className="block skew-x-12">Buy now</span>
        </button>
      </div>

      {/* DETAILS */}
      <div className="border-t border-white/10">
        {product.accordions.map((a) => (
          <Accordion key={a.title} {...a} />
        ))}
      </div>
    </div>
  );
}