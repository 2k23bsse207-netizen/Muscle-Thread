import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
} from 'react';
import { gsap } from 'gsap';
import { Sparkles, X } from 'lucide-react';
import { LIME } from '../../theme';
import type { Promo } from './Admindata';

const blank = {
  code: '',
  type: 'Percent' as Promo['type'],
  value: '10',
  limit: '500',
  ends: '',
};

function Field({
  title,
  className = '',
  ...rest
}: { title: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#171914]/60">
        {title}
      </span>
      <input
        {...rest}
        className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 text-xs font-semibold text-[#171914] shadow-xs outline-none transition-all placeholder:text-[#171914]/30 focus:border-black/40 focus:ring-2 focus:ring-[#C8F31D]/40"
      />
    </label>
  );
}

export default function PromoDrawer({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (p: Promo) => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.to(panel.current, {
      xPercent: open ? 0 : 100,
      duration: 0.4,
      ease: 'power3.inOut',
    });
    gsap.to(veil.current, {
      opacity: open ? 1 : 0,
      duration: 0.3,
      pointerEvents: open ? 'auto' : 'none',
    });
  }, [open]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const gen = () => {
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    setF((s) => ({ ...s, code: `MOVE-${rand}` }));
  };

  const submit = () => {
    if (!f.code.trim() || !f.ends) {
      setErr('Please provide a voucher code and expiration date.');
      return;
    }
    onCreate({
      code: f.code.toUpperCase().trim(),
      type: f.type,
      value: f.type === 'Free shipping' ? 0 : Number(f.value),
      used: 0,
      limit: Number(f.limit) || 100,
      ends: f.ends,
      status: 'Active',
    });
    setF(blank);
    setErr('');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        ref={veil}
        onClick={onClose}
        className="pointer-events-none fixed inset-0 z-50 bg-[#171914]/60 backdrop-blur-xs opacity-0 transition-opacity"
      />

      {/* Drawer Panel */}
      <aside
        ref={panel}
        aria-hidden={!open}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md translate-x-full flex-col border-l border-black/[0.08] bg-[#F6F4EE] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.06] bg-white/70 px-6 py-5 backdrop-blur-md">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#171914]/40">
              New Campaign
            </span>
            <h2 className="font-display text-xl font-black italic uppercase tracking-tight text-[#171914]">
              Create Promotion
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] text-[#171914]/60 transition hover:bg-[#EFECE3] hover:text-[#171914]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 space-y-4.5 overflow-y-auto p-6">
          {/* Code input with Auto-generator */}
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#171914]/60">
              Voucher Code
            </span>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="text"
                value={f.code}
                onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })}
                placeholder="MOVE-SUMMER"
                className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 font-mono text-xs font-black tracking-wider text-[#171914] shadow-xs outline-none transition-all placeholder:font-sans placeholder:font-normal placeholder:text-[#171914]/30 focus:border-black/40 focus:ring-2 focus:ring-[#C8F31D]/40"
              />
              <button
                type="button"
                onClick={gen}
                title="Generate randomized code"
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-black/10 bg-[#171914] px-3.5 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-black active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: LIME }} />
                <span>Auto</span>
              </button>
            </div>
          </div>

          {/* Discount Type */}
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#171914]/60">
              Discount Structure
            </span>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {(['Percent', 'Fixed', 'Free shipping'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setF({ ...f, type: t })}
                  className={`rounded-xl border py-2.5 text-center text-xs font-bold transition-all ${
                    f.type === t
                      ? 'border-[#171914] bg-[#171914] text-white shadow-sm'
                      : 'border-black/[0.08] bg-white text-[#171914]/65 hover:bg-[#FAF8F3]'
                  }`}
                >
                  {t === 'Percent' ? '% Off' : t === 'Fixed' ? '$ Amount' : 'Free Ship'}
                </button>
              ))}
            </div>
          </div>

          {/* Value input if not Free shipping */}
          {f.type !== 'Free shipping' && (
            <Field
              title={f.type === 'Percent' ? 'Percentage Value (%)' : 'Fixed Discount Amount ($)'}
              type="number"
              min={1}
              value={f.value}
              onChange={(e) => setF({ ...f, value: e.target.value })}
              placeholder={f.type === 'Percent' ? '15' : '20'}
            />
          )}

          {/* Usage limit */}
          <Field
            title="Max Redemption Limit"
            type="number"
            min={1}
            value={f.limit}
            onChange={(e) => setF({ ...f, limit: e.target.value })}
            placeholder="500"
          />

          {/* Expiry date */}
          <Field
            title="Expiration Date"
            type="date"
            value={f.ends}
            onChange={(e) => setF({ ...f, ends: e.target.value })}
          />

          {/* Error Message Banner */}
          {err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              {err}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-black/[0.06] bg-white/70 p-6 backdrop-blur-md">
          <button
            type="button"
            onClick={submit}
            className="w-full rounded-xl py-3.5 text-xs font-black uppercase tracking-widest text-black shadow-md transition hover:brightness-105 active:scale-98"
            style={{ background: LIME }}
          >
            Launch Promotion
          </button>
        </div>
      </aside>
    </>
  );
}
