import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  Calendar,
  Check,
  Copy,
  DollarSign,
  Percent,
  Plus,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { LIME } from '../../theme';
import AdminLayout from './Adminlayout';
import PromoDrawer from './Promodrawer';
import { CountUp } from '../Products/Statcards';
import { PageHeader, Toggle, card, kicker } from './Ui';
import { promos as seed } from './Admindata';
import type { Promo } from './Admindata';
import { useReveal } from '../../ProductInfo/Usereveal';

const tabs = ['All', 'Active', 'Scheduled', 'Paused', 'Expired'] as const;

const offerLabel = (p: Promo) =>
  p.type === 'Percent'
    ? `${p.value}% OFF`
    : p.type === 'Fixed'
      ? `$${p.value} OFF`
      : 'FREE SHIPPING';

const statusBadgeStyles: Record<
  Promo['status'],
  { bg: string; text: string; dot: string }
> = {
  Active: {
    bg: 'bg-[#C8F31D]/20 border border-[#C8F31D]/40',
    text: 'text-[#3E4F06] font-black',
    dot: 'bg-[#739407]',
  },
  Scheduled: {
    bg: 'bg-sky-50 border border-sky-200',
    text: 'text-sky-800 font-bold',
    dot: 'bg-sky-500',
  },
  Paused: {
    bg: 'bg-amber-50 border border-amber-200',
    text: 'text-amber-800 font-bold',
    dot: 'bg-amber-500',
  },
  Expired: {
    bg: 'bg-stone-100 border border-stone-200',
    text: 'text-stone-500 font-bold',
    dot: 'bg-stone-400',
  },
};

export default function DiscountsPage() {
  const [list, setList] = useState<Promo[]>(seed);
  const [tab, setTab] = useState<(typeof tabs)[number]>('All');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState('');
  const ref = useReveal<HTMLDivElement>(0.08);
  const body = useRef<HTMLTableSectionElement>(null);

  const rows = useMemo(
    () => list.filter((p) => tab === 'All' || p.status === tab),
    [list, tab]
  );
  const redemptions = list.reduce((n, p) => n + p.used, 0);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!body.current) return;
    gsap.fromTo(
      body.current.children,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, stagger: 0.04, ease: 'power3.out' }
    );
  }, [tab, list.length]);

  const flip = (code: string, on: boolean) =>
    setList((l) =>
      l.map((p) =>
        p.code === code ? { ...p, status: on ? 'Active' : 'Paused' } : p
      )
    );

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 1500);
  };

  const statMetrics = [
    {
      k: 'Active Campaigns',
      node: <CountUp to={list.filter((p) => p.status === 'Active').length} />,
      icon: Tag,
      note: 'Live promotional rules',
    },
    {
      k: 'Total Redemptions',
      node: <CountUp to={redemptions} />,
      icon: TrendingUp,
      note: 'Across all vouchers',
    },
    {
      k: 'Attributed Revenue',
      node: <CountUp to={31480} prefix="$" />,
      icon: DollarSign,
      note: '+16.8% conversion lift',
    },
    {
      k: 'Average Discount',
      node: <CountUp to={11.2} decimals={1} suffix="%" />,
      icon: Percent,
      note: 'Target margin safe (<15%)',
    },
  ];

  return (
    <AdminLayout active="Discounts & Promos">
      <div ref={ref} className="space-y-7">
        {/* Page Header */}
        <div data-reveal>
          <PageHeader
            title="Discounts & Promotions"
            sub="Design promotional coupons, threshold-based deals, and athlete capsule drops."
            badge="Campaign Engine"
          >
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-sm transition hover:brightness-105 active:scale-98"
              style={{ background: LIME }}
            >
              <Plus className="h-4 w-4" />
              <span>Create Campaign</span>
            </button>
          </PageHeader>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
          {statMetrics.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.k}
                data-reveal
                className={`${card} group relative overflow-hidden p-5.5 hover:-translate-y-1 hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <span className={kicker}>{s.k}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.06] bg-[#F4F1EA] text-[#171914] shadow-inner transition-colors group-hover:border-[#C8F31D]/50 group-hover:bg-[#C8F31D]/15">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                </div>

                <p className="font-display mt-5 text-3xl font-black italic tracking-tight text-[#171914] sm:text-4xl">
                  {s.node}
                </p>

                <p className="mt-2 text-[10px] font-medium text-[#171914]/40">
                  {s.note}
                </p>
              </div>
            );
          })}
        </div>

        {/* Status Filter Tabs */}
        <div data-reveal className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => {
            const isCurrent = tab === t;
            const count =
              t === 'All'
                ? list.length
                : list.filter((p) => p.status === t).length;

            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-[#181B15] text-white shadow-sm'
                    : 'border border-black/[0.06] bg-white text-[#171914]/65 hover:bg-[#FAF8F3] hover:text-[#171914]'
                }`}
              >
                <span>{t}</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${
                    isCurrent
                      ? 'bg-white/15 text-white'
                      : 'bg-black/[0.05] text-[#171914]/60'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Promotions Table Card */}
        <div data-reveal className={`${card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#FAF8F3] text-[9px] font-bold uppercase tracking-[0.14em] text-[#171914]/40">
                  <th className="px-6 py-4">Voucher Code</th>
                  <th className="py-4">Incentive</th>
                  <th className="py-4">Usage & Quota</th>
                  <th className="py-4">Validity</th>
                  <th className="py-4">State</th>
                  <th className="px-6 py-4 text-right">Switch</th>
                </tr>
              </thead>
              <tbody ref={body} className="divide-y divide-black/[0.05]">
                {rows.map((p) => {
                  const pct = Math.min(100, (p.used / p.limit) * 100);
                  const locked =
                    p.status === 'Expired' || p.status === 'Scheduled';
                  const st = statusBadgeStyles[p.status];
                  const isCopied = copied === p.code;

                  return (
                    <tr
                      key={p.code}
                      className="transition-colors hover:bg-[#FAF8F3]/70"
                    >
                      {/* Code with Copy Tooltip */}
                      <td className="px-6 py-4.5">
                        <button
                          type="button"
                          onClick={() => copy(p.code)}
                          title="Click to copy voucher code"
                          className="group inline-flex items-center gap-2 rounded-lg border border-black/[0.08] bg-[#F7F5EF] px-2.5 py-1.5 font-mono text-xs font-black tracking-wider text-[#171914] transition hover:border-[#171914]/30 hover:bg-white"
                        >
                          <span>{p.code}</span>
                          {isCopied ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-[#171914]/40 transition group-hover:text-[#171914]" />
                          )}
                          {isCopied && (
                            <span className="text-[9px] font-bold text-emerald-700">
                              Copied!
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Offer */}
                      <td className="py-4.5">
                        <span className="font-display rounded-md bg-[#181B15] px-2.5 py-1 text-xs font-bold text-white tracking-wide">
                          {offerLabel(p)}
                        </span>
                      </td>

                      {/* Usage Progress */}
                      <td className="py-4.5">
                        <div className="w-36">
                          <div className="mb-1.5 flex items-center justify-between text-[10px]">
                            <span className="font-bold text-[#171914]">
                              {p.used}{' '}
                              <span className="font-normal text-[#171914]/40">
                                / {p.limit}
                              </span>
                            </span>
                            <span className="font-mono text-[9px] text-[#171914]/50">
                              {Math.round(pct)}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#E8E4D9]">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${pct}%`,
                                background: pct > 90 ? '#E11D48' : LIME,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Validity Date */}
                      <td className="py-4.5 text-[#171914]/65">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Calendar className="h-3.5 w-3.5 text-[#171914]/35" />
                          <span>{p.ends}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[9px] uppercase tracking-wider ${st.bg} ${st.text}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${st.dot}`}
                          />
                          {p.status}
                        </span>
                      </td>

                      {/* Live Toggle */}
                      <td className="px-6 py-4.5 text-right">
                        <Toggle
                          label={`Toggle ${p.code}`}
                          on={p.status === 'Active'}
                          disabled={locked}
                          onChange={(v) => flip(p.code, v)}
                        />
                      </td>
                    </tr>
                  );
                })}

                {!rows.length && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EDE4] text-[#171914]/40">
                          <Tag className="h-6 w-6" />
                        </span>
                        <p className="mt-3 text-sm font-bold text-[#171914]">
                          No promotions found
                        </p>
                        <p className="mt-1 text-xs text-[#171914]/50">
                          There are currently no campaigns matching the "{tab}" filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-out Drawer */}
      <PromoDrawer
        open={open}
        onClose={() => setOpen(false)}
        onCreate={(p) => setList((l) => [p, ...l])}
      />
    </AdminLayout>
  );
}
