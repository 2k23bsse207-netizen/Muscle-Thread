import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Lock, ShieldCheck } from 'lucide-react';
import { LIME } from '../theme';
import { payMethods } from './Data';
import { Field, Frame, Panel } from './Field';

const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExp = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
};

/** Live preview of the card being typed. */
function CardPreview({ number, name, exp }: { number: string; name: string; exp: string }) {
  const digits = number.replace(/\s/g, '');
  const shown = Array.from({ length: 16 }, (_, i) => digits[i] ?? '•')
    .join('')
    .replace(/(.{4})/g, '$1 ')
    .trim();

  return (
    <Frame size={26} className="w-full max-w-[360px]" innerClassName="p-0">
      <div
        className="relative aspect-[1.586/1] overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg, #222 0%, #0a0a0a 70%)' }}
      >
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-25 blur-3xl"
          style={{ background: LIME }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1.3px)',
            backgroundSize: '14px 14px',
          }}
        />

        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="h-8 w-11 rounded-md border border-white/20" style={{ background: `${LIME}55` }} />
            <svg viewBox="0 0 62 30" className="h-4 w-auto" fill={LIME} aria-hidden="true">
              <path d="M14 0h20L20 30H0z" />
              <path d="M42 0h20L48 30H28z" />
            </svg>
          </div>

          <p className="font-display text-xl font-bold italic tracking-[0.14em] text-white tabular-nums sm:text-2xl">
            {shown}
          </p>

          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">Card holder</p>
              <p className="truncate text-xs font-bold uppercase tracking-wider text-white">{name || 'Your name'}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">Expires</p>
              <p className="text-xs font-bold tabular-nums text-white">{exp || 'MM / YY'}</p>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

export default function PaymentForm() {
  const [method, setMethod] = useState(0);
  const [card, setCard] = useState('');
  const [exp, setExp] = useState('');
  const [name, setName] = useState('');
  const panel = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.fromTo(panel.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
  }, [method]);

  return (
    <Panel title="Payment" index="04" tag="Encrypted">
      <div role="tablist" aria-label="Payment method" className="mb-7 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {payMethods.map((m, i) => {
          const on = i === method;
          return (
            <button
              key={m}
              role="tab"
              aria-selected={on}
              onClick={() => setMethod(i)}
              className={`-skew-x-12 border py-3 text-[10px] font-black uppercase tracking-wider transition-colors ${
                on ? 'border-transparent text-black' : 'border-white/20 text-white/70 hover:border-white/60 hover:text-white'
              }`}
              style={on ? { background: LIME } : undefined}
            >
              <span className="block skew-x-12">{m}</span>
            </button>
          );
        })}
      </div>

      <div ref={panel}>
        {method === 0 ? (
          <div className="grid items-start gap-8 md:grid-cols-[minmax(0,360px)_1fr]">
            <CardPreview number={card} name={name} exp={exp} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                title="Name on card"
                placeholder="Alex Rivera"
                autoComplete="cc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="sm:col-span-2"
              />
              <Field
                title="Card number"
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                autoComplete="cc-number"
                value={card}
                onChange={(e) => setCard(fmtCard(e.target.value))}
                icon={<Lock className="h-4 w-4" />}
                className="sm:col-span-2"
              />
              <Field
                title="Expiration"
                placeholder="MM / YY"
                autoComplete="cc-exp"
                value={exp}
                onChange={(e) => setExp(fmtExp(e.target.value))}
              />
              <Field
                title="Security code"
                inputMode="numeric"
                maxLength={4}
                placeholder="•••"
                type="password"
                autoComplete="cc-csc"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4 border border-white/10 bg-white/[0.04] p-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: LIME }} />
            <p className="text-sm leading-relaxed text-white/70">
              You’ll confirm with {payMethods[method]} when you complete the order. Your card details never touch our
              servers.
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
}