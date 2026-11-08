import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { LIME } from '../../theme';
import AdminLayout from './Adminlayout';
import { CountUp } from '../Products/Statcards';
import RevenueChart from './Revenuechart';
import { PageHeader, card, kicker } from './Ui';
import { lowStock, orders, topSellers } from './Admindata';
import { useReveal } from '../../ProductInfo/Usereveal';

const tiles = [
  {
    k: 'Revenue (30D)',
    to: 48920,
    prefix: '$',
    note: '+12.4%',
    icon: DollarSign,
    sub: 'vs previous 30 days',
  },
  {
    k: 'Total Orders',
    to: 1284,
    note: '+8.1%',
    icon: ShoppingBag,
    sub: '98.2% fulfillment rate',
  },
  {
    k: 'Conversion Rate',
    to: 3.8,
    decimals: 1,
    suffix: '%',
    note: '+0.4pt',
    icon: TrendingUp,
    sub: 'Storefront average',
  },
  {
    k: 'Avg Order Value',
    to: 76.3,
    decimals: 2,
    prefix: '$',
    note: '+2.9%',
    icon: CreditCard,
    sub: '+$2.15 vs last month',
  },
];

const statusStyles: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  Paid: {
    bg: 'bg-[#C8F31D]/20 border border-[#C8F31D]/40',
    text: 'text-[#3E4F06] font-black',
    dot: 'bg-[#739407]',
  },
  Packing: {
    bg: 'bg-amber-50 border border-amber-200/60',
    text: 'text-amber-800 font-bold',
    dot: 'bg-amber-500',
  },
  Shipped: {
    bg: 'bg-[#181B15] border border-black/20',
    text: 'text-white font-bold',
    dot: 'bg-[#C8F31D]',
  },
  Refunded: {
    bg: 'bg-rose-50 border border-rose-200/60',
    text: 'text-rose-700 font-bold',
    dot: 'bg-rose-500',
  },
};

export default function DashboardPage() {
  const ref = useReveal<HTMLDivElement>(0.08);
  const bars = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.seller-bar', {
        scaleX: 0,
        transformOrigin: 'left',
        duration: 1,
        ease: 'power3.out',
        stagger: 0.08,
        delay: 0.3,
      });
    }, bars);
    return () => ctx.revert();
  }, []);

  return (
    <AdminLayout active="Dashboard">
      <div ref={ref} className="space-y-7">
        {/* Page Header */}
        <div data-reveal>
          <PageHeader
            title="Executive Dashboard"
            sub="Real-time athletic apparel metrics, sales performance, and logistics telemetry."
            badge="Live Telemetry"
          >
            <span className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2 text-[10px] font-bold text-[#171914]/60 shadow-xs">
              <span className="h-2 w-2 rounded-full" style={{ background: LIME }} />
              Auto-refresh: 5m
            </span>
          </PageHeader>
        </div>

        {/* 4 Metric Summary Tiles */}
        <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.k}
                data-reveal
                className={`${card} group relative overflow-hidden p-5.5 hover:-translate-y-1 hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <span className={kicker}>{t.k}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.06] bg-[#F4F1EA] text-[#171914] shadow-inner transition-colors group-hover:border-[#C8F31D]/50 group-hover:bg-[#C8F31D]/15">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                </div>

                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-black italic tracking-tight text-[#171914] sm:text-4xl">
                    <CountUp
                      to={t.to}
                      decimals={t.decimals}
                      prefix={t.prefix}
                      suffix={t.suffix}
                    />
                  </span>
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <ArrowUpRight className="h-3 w-3" />
                    {t.note}
                  </span>
                </div>

                <p className="mt-2 text-[10px] font-medium text-[#171914]/40">
                  {t.sub}
                </p>
              </div>
            );
          })}
        </div>

        {/* Chart + Top Sellers Section */}
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <RevenueChart />

          {/* Top Sellers Card */}
          <div ref={bars} data-reveal className={`${card} flex flex-col p-6`}>
            <div className="mb-5 flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div>
                <span className={kicker}>Leaderboard</span>
                <h3 className="mt-0.5 text-base font-bold text-[#171914]">
                  Top Velocity Garments
                </h3>
              </div>
              <span className="rounded-lg bg-[#F2EFE8] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#171914]/60">
                Units
              </span>
            </div>

            <ul className="flex-1 space-y-4.5">
              {topSellers.map((s, idx) => {
                const pct = (s.units / topSellers[0].units) * 100;
                return (
                  <li key={s.name} className="group">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#F2EFE8] text-[9px] font-bold text-[#171914]/50">
                          0{idx + 1}
                        </span>
                        <span className="truncate font-bold text-[#171914] group-hover:text-black">
                          {s.name}
                        </span>
                      </div>
                      <span className="font-display shrink-0 text-sm font-bold text-[#171914]">
                        {s.units}{' '}
                        <small className="text-[9px] font-normal text-[#171914]/40">
                          sold
                        </small>
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[#EAE6DC]">
                      <div
                        className="seller-bar h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, #171914 0%, ${LIME} 100%)`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 border-t border-black/[0.06] pt-3 text-right">
              <a
                href="/admin/products"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#171914] hover:underline"
              >
                <span>View catalog breakdown</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Orders Table + Low Stock Alert Section */}
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          {/* Recent Orders Card */}
          <div data-reveal className={`${card} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4.5">
              <div>
                <span className={kicker}>Live Queue</span>
                <h3 className="mt-0.5 text-base font-bold text-[#171914]">
                  Recent Customer Orders
                </h3>
              </div>
              <span className="rounded-lg bg-[#F2EFE8] px-2.5 py-1 text-[9px] font-bold text-[#171914]/60">
                {orders.length} PENDING
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead>
                  <tr className="border-b border-black/[0.04] bg-[#FAF8F3] text-[9px] font-bold uppercase tracking-[0.14em] text-[#171914]/40">
                    <th className="px-6 py-3">Order ID</th>
                    <th className="py-3">Customer</th>
                    <th className="py-3">Quantity</th>
                    <th className="py-3">Amount</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {orders.map((o) => {
                    const st = statusStyles[o.status] || {
                      bg: 'bg-gray-100',
                      text: 'text-gray-800',
                      dot: 'bg-gray-500',
                    };

                    return (
                      <tr
                        key={o.id}
                        className="transition-colors hover:bg-[#FAF8F3]/80"
                      >
                        <td className="px-6 py-3.5 font-mono text-[11px] font-black text-[#171914]">
                          {o.id}
                        </td>
                        <td className="py-3.5 font-semibold text-[#171914]">
                          {o.who}
                        </td>
                        <td className="py-3.5 text-[#171914]/50">
                          {o.items} {o.items === 1 ? 'item' : 'items'}
                        </td>
                        <td className="py-3.5 font-bold text-[#171914]">
                          ${o.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[9px] uppercase tracking-wider ${st.bg} ${st.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Replenishment Alert Card (Luxury Dark Olive Card) */}
          <div
            data-reveal
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#171B14] p-6 text-white shadow-xl"
          >
            {/* Ambient Background Circles */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full border border-white/[0.06] bg-white/[0.01]" />
            <div className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rounded-full border border-white/[0.06]" />

            <div className="relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                  <AlertTriangle
                    className="h-3.5 w-3.5"
                    style={{ color: LIME }}
                  />
                  Replenish Alert
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-black"
                  style={{ background: LIME }}
                >
                  Action Required
                </span>
              </div>

              <p className="mt-3 text-xs text-white/50">
                The following core garments have dropped below safety thresholds:
              </p>

              <ul className="mt-4 space-y-3.5">
                {lowStock.map((l) => (
                  <li
                    key={l.sku}
                    className="group flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 transition hover:border-white/20 hover:bg-white/[0.08]"
                  >
                    <div>
                      <p className="text-xs font-bold text-white transition-colors group-hover:text-white">
                        {l.name}
                      </p>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">
                        {l.sku}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className="font-display block text-sm font-black"
                        style={{ color: LIME }}
                      >
                        {l.left} left
                      </span>
                      <span className="text-[8px] uppercase tracking-widest text-red-400">
                        Critical
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <a
                  href="/admin/products"
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-center text-xs font-black uppercase tracking-wider text-black shadow-md transition hover:brightness-105 active:scale-98"
                  style={{ background: LIME }}
                >
                  <Package className="h-4 w-4" />
                  <span>Manage Inventory</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
