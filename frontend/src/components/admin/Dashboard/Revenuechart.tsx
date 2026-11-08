import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { TrendingUp } from 'lucide-react';
import { LIME } from '../../theme';
import { ranges, revenue } from './Admindata';
import type { Range } from './Admindata';
import { card, kicker } from './Ui';

const W = 640,
  H = 220,
  P = 16;

export default function RevenueChart() {
  const [range, setRange] = useState<Range>('30D');
  const [hover, setHover] = useState<number | null>(null);
  const line = useRef<SVGPathElement>(null);
  const area = useRef<SVGPathElement>(null);
  const data = revenue[range];

  const pts = useMemo(() => {
    const max = Math.max(...data) * 1.12;
    return data.map((v, i) => [
      P + (i / (data.length - 1)) * (W - P * 2),
      H - P - (v / max) * (H - P * 2),
    ]);
  }, [data]);

  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const total = data.reduce((a, b) => a + b, 0);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!line.current) return;
    const len = line.current.getTotalLength();
    gsap.fromTo(
      line.current,
      { strokeDasharray: len, strokeDashoffset: len },
      { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out' }
    );
    if (area.current) {
      gsap.fromTo(area.current, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.3 });
    }
  }, [range]);

  const move = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHover(
      Math.round(
        Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (data.length - 1)
      )
    );
  };

  return (
    <div className={`${card} p-6`} data-reveal>
      {/* Header with Title, Value & Range Switcher */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={kicker}>Revenue Velocity</span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
              <TrendingUp className="h-3 w-3" />
              +14.2%
            </span>
          </div>

          <p className="mt-2 text-3xl font-black italic tracking-tight text-[#171914] sm:text-4xl">
            ${(hover !== null ? data[hover] : total).toLocaleString()}
          </p>

          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#171914]/45">
            {hover !== null ? `Timeline Day ${hover + 1} Volume` : `Gross Sales (Last ${range})`}
          </span>
        </div>

        {/* Segmented Range Controls */}
        <div className="flex items-center rounded-xl border border-black/[0.08] bg-[#F4F1EA] p-1 shadow-inner">
          {ranges.map((r) => {
            const isCurrent = range === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRange(r);
                  setHover(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-wider transition-all ${
                  isCurrent
                    ? 'bg-[#171914] text-white shadow-sm'
                    : 'text-[#171914]/55 hover:text-[#171914]'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#FBF9F5] to-[#F5F2EB]/60 p-2 border border-black/[0.04]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full overflow-visible"
          onMouseMove={move}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LIME} stopOpacity="0.55" />
              <stop offset="70%" stopColor={LIME} stopOpacity="0.08" />
              <stop offset="100%" stopColor={LIME} stopOpacity="0" />
            </linearGradient>
            <filter id="lineShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#171914" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1={P} y1={H * 0.25} x2={W - P} y2={H * 0.25} stroke="#171914" strokeOpacity="0.05" strokeDasharray="4 4" />
          <line x1={P} y1={H * 0.5} x2={W - P} y2={H * 0.5} stroke="#171914" strokeOpacity="0.05" strokeDasharray="4 4" />
          <line x1={P} y1={H * 0.75} x2={W - P} y2={H * 0.75} stroke="#171914" strokeOpacity="0.05" strokeDasharray="4 4" />

          {/* Area Fill */}
          <path
            ref={area}
            d={`${d} L${pts.at(-1)![0]} ${H} L${P} ${H} Z`}
            fill="url(#revenueGlow)"
          />

          {/* Line Stroke */}
          <path
            ref={line}
            d={d}
            fill="none"
            stroke="#171914"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#lineShadow)"
          />

          {/* Interactive Hover Point & Indicator */}
          {hover !== null && (
            <g>
              <line
                x1={pts[hover][0]}
                x2={pts[hover][0]}
                y1="0"
                y2={H}
                stroke="#171914"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                strokeOpacity="0.35"
              />
              <circle
                cx={pts[hover][0]}
                cy={pts[hover][1]}
                r="7"
                fill={LIME}
                stroke="#171914"
                strokeWidth="2.5"
                className="shadow-lg"
              />
              <circle
                cx={pts[hover][0]}
                cy={pts[hover][1]}
                r="3"
                fill="#171914"
              />
            </g>
          )}
        </svg>

        {/* Axis markers */}
        <div className="mt-2 flex items-center justify-between px-3 text-[9px] font-bold uppercase tracking-wider text-[#171914]/35">
          <span>Start of period</span>
          <span>Midpoint</span>
          <span>Current</span>
        </div>
      </div>
    </div>
  );
}
