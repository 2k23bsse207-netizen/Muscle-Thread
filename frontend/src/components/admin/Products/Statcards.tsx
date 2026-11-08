import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Gauge,
  Wallet,
  Zap,
} from 'lucide-react';
import { LIME } from '../../theme';

export function CountUp({
  to,
  decimals = 0,
  prefix = '',
  suffix = '',
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const format = (value: number) =>
      prefix +
      value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) +
      suffix;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      if (ref.current) ref.current.textContent = format(to);
      return;
    }

    const counter = { value: 0 };

    const tween = gsap.to(counter, {
      value: to,
      duration: 1.2,
      delay: 0.15,
      ease: 'power3.out',
      onUpdate: () => {
        if (ref.current) ref.current.textContent = format(counter.value);
      },
    });

    return () => {
      tween.kill();
    };
  }, [to, decimals, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

const kicker = 'text-[9px] font-black uppercase tracking-[0.15em] text-[#181B15]/45';

export default function StatCards() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from('.stat-card', {
        y: 18,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power3.out',
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Catalog Value */}
      <div className="stat-card group relative overflow-hidden rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className={kicker}>Catalog Value</span>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F0F2E9] text-[#555E45] transition-colors group-hover:bg-[#E7EADF]">
            <Wallet size={16} />
          </span>
        </div>
        <p className="mt-4 font-mono text-2xl font-black tracking-tight text-[#181B15] sm:text-3xl">
          <CountUp to={142840} decimals={2} prefix="$" />
        </p>
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700">
            <ArrowUpRight size={12} className="text-emerald-600" />
            +6.2%
          </span>
          <span className="text-[10px] text-black/40 font-medium">vs last month</span>
        </div>
      </div>

      {/* 2. Active Run Rate */}
      <div className="stat-card group relative overflow-hidden rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className={kicker}>Active Run Rate</span>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F0F2E9] text-[#555E45] transition-colors group-hover:bg-[#E7EADF]">
            <Gauge size={16} />
          </span>
        </div>
        <p className="mt-4 font-mono text-2xl font-black tracking-tight text-[#181B15] sm:text-3xl">
          <CountUp to={89.4} decimals={1} suffix="%" />
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#EFEFEA]">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: '89.4%', background: LIME }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px]">
          <span className="text-black/40 font-medium">Fulfillment capacity</span>
          <span className="font-bold text-[#181B15]">Optimal</span>
        </div>
      </div>

      {/* 3. Replenishment Alert */}
      <div className="stat-card group relative overflow-hidden rounded-2xl border border-red-500/20 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-red-600">
            Replenishment Alert
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-600 transition-colors group-hover:bg-red-100/70">
            <AlertTriangle size={16} />
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <p className="font-mono text-2xl font-black tracking-tight text-red-600 sm:text-3xl">
            <CountUp to={12} />
          </p>
          <span className="text-xs font-bold uppercase tracking-wider text-black/45">
            SKUs below threshold
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-black text-red-700">
            <Boxes size={11} />
            Stock &le; 10 Units
          </span>
          <span className="text-[10px] text-black/40 font-medium">Reorder recommended</span>
        </div>
      </div>

      {/* 4. Drop 04 Velocity - Premium Dark Capsule Card */}
      <div
        className="stat-card group relative overflow-hidden rounded-2xl p-5 text-white shadow-[0_8px_24px_rgba(24,27,21,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
        style={{ background: '#181B15' }}
      >
        {/* Subtle geometric radar rings */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute -right-2 -top-2 h-24 w-24 rounded-full border border-white/[0.06]" />
        <div className="pointer-events-none absolute right-4 top-4 h-12 w-12 rounded-full border border-white/[0.04]" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ background: LIME }}
            />
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/50">
              Live Capsule
            </span>
          </div>
          <span
            className="grid h-8 w-8 place-items-center rounded-xl bg-white/10"
            style={{ color: LIME }}
          >
            <Zap size={15} />
          </span>
        </div>

        <p className="relative mt-4 text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
          Drop 04 Velocity
        </p>

        <div className="relative mt-2.5 flex items-center justify-between text-xs">
          <span className="text-[10px] uppercase tracking-wider text-white/50">
            Allocation Sold
          </span>
          <span className="font-mono text-sm font-black" style={{ color: LIME }}>
            96.4%
          </span>
        </div>

        <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: '96.4%', background: LIME }}
          />
        </div>
      </div>
    </div>
  );
}
