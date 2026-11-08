import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Lock, RotateCcw, ShieldCheck } from 'lucide-react';
import { LIME } from '../theme';
import CheckoutHeader from './Checkoutheader';
import CartItems from './Cartitems';
import { ShippingDestination, ShippingMethod } from './Shippingform';
import PaymentForm from './Paymentform';
import OrderSummary from './Ordersummary';
import PairedGear from './Pairedgear';
import { FREE_SHIP_AT, PROMO, TAX_RATE, initialItems, paired, shippingMethods } from './Data';
import type { CartItem } from './Data';
import { useReveal } from '../ProductInfo/Usereveal';

const TRUST = [
  { label: 'Buyer protection', Icon: ShieldCheck },
  { label: 'Free 60-day returns', Icon: RotateCcw },
  { label: 'Encrypted payment', Icon: Lock },
];

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [method, setMethod] = useState('standard');
  const [promoOn, setPromoOn] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const gridRef = useReveal<HTMLDivElement>(0.12);
  const pageRef = useRef<HTMLElement>(null);
  const placeTimer = useRef<number | undefined>(undefined);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const chosen = shippingMethods.find((x) => x.id === method) ?? shippingMethods[0];
    const shipping = subtotal >= FREE_SHIP_AT ? 0 : chosen.price;
    const discount = promoOn ? subtotal * PROMO.pct : 0;
    const tax = subtotal * TAX_RATE;
    return {
      subtotal,
      shipping,
      discount,
      tax,
      total: subtotal - discount + tax + shipping,
      count: items.reduce((n, i) => n + i.qty, 0),
    };
  }, [items, method, promoOn]);

  // One orchestrated entrance: breadcrumb → title → trust chips → gateway strip → steps
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-eyebrow', { opacity: 0, y: -12, duration: 0.45 })
        .from('.hero-title', { opacity: 0, y: 48, duration: 0.85 }, 0.08)
        .from('.hero-trust li', { opacity: 0, y: 16, duration: 0.5, stagger: 0.08 }, 0.3)
        .from('.checkout-strip', { opacity: 0, y: -14, duration: 0.5 }, 0.15)
        .from('.step-item', { opacity: 0, y: 20, duration: 0.5, stagger: 0.09 }, 0.35)
        .from('.progress-card', { opacity: 0, y: 20, duration: 0.6 }, 0.7);
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const setQty = (id: string, d: number) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i)));

  const remove = (id: string) => setItems((p) => p.filter((i) => i.id !== id));

  const addPaired = (id: string) => {
    const g = paired.find((p) => p.id === id);
    if (!g) return;
    setItems((p) => [
      ...p,
      { id, name: g.name, meta: 'Size: One size', stock: 'In stock', price: g.price, qty: 1, src: g.src },
    ]);
  };

  const place = () => {
    setStatus('processing');
    window.clearTimeout(placeTimer.current);
    placeTimer.current = window.setTimeout(() => setStatus('done'), 1700); // TODO: replace with your real payment call
  };

  return (
    <main ref={pageRef} className="relative overflow-hidden bg-black text-white">
      {/* backdrop: same dot grid + neon glow as the hero artwork */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[800px]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1.3px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 70% 20%, #000, transparent 100%)',
            maskImage: 'radial-gradient(ellipse 70% 60% at 70% 20%, #000, transparent 100%)',
          }}
        />
        <div
          className="absolute -right-40 top-10 h-[460px] w-[460px] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: LIME }}
        />
      </div>

      <section className="relative mx-auto max-w-[1280px] px-6 pt-28 sm:pt-32">
        <nav aria-label="Breadcrumb">
          <ol className="hero-eyebrow flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
            <li>
              <Link to="/" className="transition-colors hover:text-white">Home</Link>
            </li>
            <li aria-hidden="true" style={{ color: LIME }}>/</li>
            <li>Checkout</li>
            <li aria-hidden="true" style={{ color: LIME }}>/</li>
            <li aria-current="page" className="text-white">Bag &amp; review</li>
          </ol>
        </nav>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-8">
          <h1 className="hero-title font-display text-6xl font-black uppercase italic leading-[0.88] tracking-tight md:text-8xl">
            <span className="block text-transparent" style={{ WebkitTextStroke: `2px ${LIME}` }}>
              Secure
            </span>
            <span className="block text-white">your gear</span>
          </h1>

          <ul className="hero-trust flex flex-wrap gap-2.5">
            {TRUST.map(({ label, Icon }) => (
              <li
                key={label}
                className="flex -skew-x-12 items-center border border-white/20 bg-white/[0.04] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/80"
              >
                <span className="flex skew-x-12 items-center gap-2">
                  <Icon className="h-3.5 w-3.5" style={{ color: LIME }} />
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CheckoutHeader step={status === 'done' ? 3 : 1} subtotal={totals.subtotal} />

      <div
        ref={gridRef}
        className="relative mx-auto grid max-w-[1280px] items-start gap-8 px-6 lg:grid-cols-[1fr_400px]"
      >
        <div className="flex flex-col gap-8">
          <CartItems items={items} onQty={setQty} onRemove={remove} />
          <ShippingDestination />
          <ShippingMethod value={method} onChange={setMethod} subtotalFree={totals.subtotal >= FREE_SHIP_AT} />
          <PaymentForm />
        </div>

        <OrderSummary
          totals={totals}
          promoOn={promoOn}
          onPromo={setPromoOn}
          onPlace={place}
          status={status}
          disabled={!items.length}
        />
      </div>

      <PairedGear inBag={items.map((i) => i.id)} onAdd={addPaired} />
    </main>
  );
}