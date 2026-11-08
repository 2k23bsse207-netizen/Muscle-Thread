import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Check } from 'lucide-react';
import { LIME } from '../theme';
import { shippingMethods } from './Data';
import { Field, Panel } from './Field';

export function ShippingDestination() {
  return (
    <Panel title="Shipping destination" index="02" tag="Where should we send it?">
      <div className="grid gap-5 md:grid-cols-2">
        <Field title="Email address" type="email" placeholder="you@email.com" autoComplete="email" className="md:col-span-2" />
        <Field title="First name" placeholder="Alex" autoComplete="given-name" />
        <Field title="Last name" placeholder="Rivera" autoComplete="family-name" />
        <Field title="Street address" placeholder="123 Kinetic Ave, Unit 4B" autoComplete="street-address" className="md:col-span-2" />
        <div className="grid gap-5 sm:grid-cols-3 md:col-span-2">
          <Field title="City" autoComplete="address-level2" />
          <Field title="Postal code" autoComplete="postal-code" />
          <Field title="Country" defaultValue="United States (US)" autoComplete="country-name" />
        </div>
      </div>
    </Panel>
  );
}

type MethodProps = { value: string; onChange: (id: string) => void; subtotalFree: boolean };

export function ShippingMethod({ value, onChange, subtotalFree }: MethodProps) {
  const wrap = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const check = wrap.current?.querySelector('[data-on="true"] .check');
    if (check) gsap.fromTo(check, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
  }, [value]);

  return (
    <Panel title="Shipping method" index="03" tag="Priority dispatch">
      <div ref={wrap} role="radiogroup" aria-label="Shipping method" className="grid gap-4 md:grid-cols-2">
        {shippingMethods.map((m) => {
          const on = m.id === value;
          const free = m.price === 0 || subtotalFree;
          return (
            <button
              key={m.id}
              role="radio"
              aria-checked={on}
              data-on={on}
              onClick={() => onChange(m.id)}
              className={`relative border p-5 text-left transition-all duration-300 ${
                on ? 'bg-white/[0.06]' : 'border-white/15 hover:border-white/40'
              }`}
              style={on ? { borderColor: LIME, boxShadow: `0 0 0 1px ${LIME}40, 0 18px 40px -24px ${LIME}60` } : undefined}
            >
              <span
                className="check absolute right-4 top-4 grid h-5 w-5 place-items-center rounded-full border"
                style={{ background: on ? LIME : 'transparent', borderColor: on ? LIME : 'rgba(255,255,255,0.3)' }}
              >
                {on && <Check className="h-3 w-3 text-black" strokeWidth={3} />}
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{m.title}</p>
              <p className="font-display mt-1 text-xl font-black italic text-white">{m.sub}</p>
              <p className="mt-1 text-xs text-white/60">{m.note}</p>
              <p
                className="font-display mt-4 text-sm font-black uppercase tracking-wider"
                style={{ color: free ? LIME : '#fff' }}
              >
                {free ? 'Free' : `+$${m.price.toFixed(2)}`}
              </p>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}