import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Check, Lock, ShieldCheck, Tag, X } from 'lucide-react';
import { LIME } from '../theme';
import { PROMO, guarantees } from './Data';
import { Frame, cut } from './Field';

export type Totals = {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  count: number;
};

type Props = {
  totals: Totals;
  promoOn: boolean;
  onPromo: (on: boolean) => void;
  onPlace: () => void;
  status: 'idle' | 'processing' | 'done';
  disabled: boolean;
};

const money = (n: number) => `$${n.toFixed(2)}`;

const Row = ({ k, v, accent }: { k: string; v: string; accent?: boolean }) => (
  <div className="flex justify-between py-2.5 text-xs">
    <span className="text-white/60">{k}</span>
    <span className="font-bold tabular-nums text-white" style={accent ? { color: LIME } : undefined}>
      {v}
    </span>
  </div>
);

export default function OrderSummary({ totals, promoOn, onPromo, onPlace, status, disabled }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const totalRef = useRef<HTMLSpanElement>(null);
  const prev = useRef(totals.total);
  const fill = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLDivElement>(null);

  // count the total up/down when it changes
  useEffect(() => {
    const o = { v: prev.current };
    const tween = gsap.to(o, {
      v: totals.total,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        if (totalRef.current) totalRef.current.textContent = money(o.v);
      },
    });
    prev.current = totals.total;
    return () => {
      void tween.kill();
    };
  }, [totals.total]);

  useEffect(() => {
    if (status === 'processing') {
      gsap.fromTo(fill.current, { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'power1.inOut' });
    }
    if (status === 'done') {
      gsap.to(fill.current, { scaleX: 0, duration: 0.4, ease: 'power2.out' });
      gsap.fromTo(btnRef.current, { scale: 1 }, { scale: 1.03, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.out' });
    }
  }, [status]);

  const apply = () => {
    if (code.trim().toUpperCase() === PROMO.code) {
      setError('');
      onPromo(true);
      return;
    }
    setError('Code not recognised.');
    gsap.fromTo(input.current, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' });
  };

  return (
    <aside data-reveal className="lg:sticky lg:top-6">
      <Frame size={30} innerClassName="p-6 md:p-7">
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
          Order specification
        </span>
        <h2 className="font-display mb-6 mt-1 text-3xl font-black italic uppercase tracking-tight text-white">
          Order summary
        </h2>

        {/* promo */}
        {promoOn ? (
          <div
            className="flex items-center justify-between border px-4 py-3 text-[11px] font-bold uppercase tracking-wider"
            style={{ borderColor: `${LIME}66`, color: LIME, background: `${LIME}12` }}
          >
            <span className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5" />
              {PROMO.code} · {Math.round(PROMO.pct * 100)}% off
            </span>
            <button onClick={() => onPromo(false)} aria-label="Remove promo code" className="text-white/60 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div ref={input} className="flex gap-2">
              <label className="flex h-11 flex-1 items-center gap-2 border border-white/15 bg-white/[0.04] px-3 transition-colors focus-within:border-white/50">
                <Tag className="h-3.5 w-3.5 text-white/40" />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && apply()}
                  placeholder="Promo code"
                  aria-label="Promo code"
                  className="w-full bg-transparent text-xs font-semibold uppercase tracking-wider text-white outline-none placeholder:text-white/30"
                />
              </label>
              <button
                onClick={apply}
                className="-skew-x-12 border border-white/25 px-4 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-black"
              >
                <span className="block skew-x-12">Apply</span>
              </button>
            </div>
            {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
          </>
        )}

        {/* breakdown */}
        <div className="my-6 divide-y divide-white/10 border-y border-white/10">
          <Row k={`Subtotal (${totals.count} items)`} v={money(totals.subtotal)} />
          <Row k="Shipping" v={totals.shipping ? money(totals.shipping) : 'Free'} accent={!totals.shipping} />
          <Row k="Estimated tax" v={money(totals.tax)} />
          {promoOn && <Row k="Promo discount" v={`-${money(totals.discount)}`} accent />}
        </div>

        {/* total */}
        <div className="mb-5 flex items-end justify-between gap-3 border-l-2 bg-white/[0.04] p-4" style={{ borderColor: LIME }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Total</p>
            <span ref={totalRef} className="font-display text-4xl font-black italic leading-none" style={{ color: LIME }}>
              {money(totals.total)}
            </span>
          </div>
          <span className="pb-1 text-[9px] font-bold uppercase tracking-widest text-white/40">Tax included</span>
        </div>

        {/* CTA */}
        <button
          ref={btnRef}
          onClick={onPlace}
          disabled={disabled || status !== 'idle'}
          className="relative w-full overflow-hidden py-4 text-xs font-black uppercase tracking-[0.18em] text-black transition-[filter,box-shadow] duration-300 hover:brightness-105 hover:shadow-[0_18px_40px_-20px_rgba(200,243,29,0.6)] active:scale-[0.99] disabled:opacity-50"
          style={{ background: LIME, clipPath: cut(14) }}
        >
          <span ref={fill} className="absolute inset-0 origin-left scale-x-0 bg-black/25" />
          <span className="relative flex items-center justify-center gap-2">
            {status === 'done' ? <Check className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {status === 'idle' ? 'Complete order' : status === 'processing' ? 'Processing…' : 'Order confirmed'}
          </span>
        </button>

        {status === 'done' && (
          <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-wider" style={{ color: LIME }}>
            Thank you. Your order is confirmed.
          </p>
        )}

        {/* guarantees */}
        <ul className="mt-6 space-y-3">
          {guarantees.map((g) => (
            <li key={g} className="flex gap-2.5 text-[11px] leading-snug text-white/60">
              <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: LIME }} />
              {g}
            </li>
          ))}
        </ul>
      </Frame>
    </aside>
  );
}