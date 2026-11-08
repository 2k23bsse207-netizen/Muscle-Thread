import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { AlertTriangle, Boxes, ImageOff, MapPin } from 'lucide-react';
import { LIME } from '../../theme';
import { LOW_STOCK_AT } from './Data';
import type { Product, Status } from './Data';

const th =
  'whitespace-nowrap px-4 py-3.5 text-left text-[9px] font-black uppercase tracking-[0.14em] text-[#181B15]/50';

const chip =
  'inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider';

const statusBadge: Record<Status, { bg: string; text: string; dot: string }> = {
  Active: {
    bg: 'bg-emerald-50 border border-emerald-600/15',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
  },
  Draft: {
    bg: 'bg-[#F2F1EC] border border-black/[0.06]',
    text: 'text-[#5A5C54]',
    dot: 'bg-[#8E9085]',
  },
  Archived: {
    bg: 'bg-black/[0.04] border border-black/[0.06]',
    text: 'text-black/40',
    dot: 'bg-black/30',
  },
};

export default function ProductTable({
  rows,
  selected,
  onToggle,
  onToggleAll,
}: {
  rows: Product[];
  selected: string[];
  onToggle: (sku: string) => void;
  onToggleAll: () => void;
}) {
  const body = useRef<HTMLTableSectionElement>(null);

  const allOn =
    rows.length > 0 && rows.every((r) => selected.includes(r.sku));

  const rowKeys = rows.map((r) => r.sku).join(',');

  useLayoutEffect(() => {
    if (
      !body.current ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;

    const tween = gsap.fromTo(
      body.current.children,
      { y: 8, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.3,
        stagger: 0.03,
        ease: 'power2.out',
      }
    );

    return () => {
      tween.kill();
    };
  }, [rowKeys]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] border-collapse text-left">
        <thead className="border-b border-black/[0.07] bg-[#F7F8F4]">
          <tr>
            <th className={`${th} w-12 pl-5`}>
              <input
                type="checkbox"
                aria-label="Select all products"
                checked={allOn}
                onChange={onToggleAll}
                className="h-4 w-4 rounded cursor-pointer accent-[#181B15]"
              />
            </th>

            <th className={th}>Garment / Style</th>
            <th className={th}>Category</th>
            <th className={th}>Collection Drop</th>
            <th className={th}>Price (USD)</th>
            <th className={th}>Sizing</th>
            <th className={th}>Colorways</th>
            <th className={th}>Inventory</th>
            <th className={th}>Status</th>
            <th className={`${th} pr-5`}>Badge</th>
          </tr>
        </thead>

        <tbody ref={body}>
          {rows.map((p) => {
            const isLowStock = p.units > 0 && p.units <= LOW_STOCK_AT;
            const isOutOfStock = p.units === 0;
            const isSelected = selected.includes(p.sku);
            const statusConfig = statusBadge[p.status];

            return (
              <tr
                key={p.sku}
                className={`border-b border-black/[0.04] transition-colors ${
                  isSelected
                    ? 'bg-[#F4F7EB]/90'
                    : 'bg-white hover:bg-[#F9FAF6]'
                }`}
              >
                {/* Checkbox */}
                <td className="py-4 pl-5">
                  <input
                    type="checkbox"
                    aria-label={`Select ${p.name}`}
                    checked={isSelected}
                    onChange={() => onToggle(p.sku)}
                    className="h-4 w-4 rounded cursor-pointer accent-[#181B15]"
                  />
                </td>

                {/* Product Info */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-black/[0.07] bg-[#F0F2EB]">
                      <img
                        src={p.src}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add(
                            'show-image-fallback'
                          );
                        }}
                      />
                      <ImageOff className="hidden h-4 w-4 text-black/30" />
                    </div>

                    <div className="min-w-0 max-w-[220px]">
                      <p className="truncate text-xs font-black text-[#181B15]">
                        {p.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-black/45">
                          {p.sku}
                        </span>
                        {p.sale && (
                          <span className="rounded bg-red-50 px-1.5 py-0.2 text-[8px] font-black uppercase text-red-600">
                            {p.sale}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-4 py-4 text-xs font-semibold text-[#181B15]/75">
                  {p.category}
                </td>

                {/* Drop */}
                <td className="px-4 py-4">
                  <div className="flex max-w-[130px] flex-wrap gap-1">
                    {p.drop.map((d) => (
                      <span
                        key={d}
                        className={`${chip} border border-black/[0.06] bg-[#F4F5EE] text-[#4A503C]`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Price */}
                <td className="px-4 py-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-xs font-black text-[#181B15]">
                      ${p.price.toFixed(2)}
                    </span>
                    {p.msrp && (
                      <span className="font-mono text-[10px] text-black/35 line-through">
                        ${p.msrp.toFixed(2)}
                      </span>
                    )}
                  </div>
                </td>

                {/* Sizing */}
                <td className="px-4 py-4">
                  <div className="flex max-w-[110px] flex-wrap gap-1">
                    {p.sizes.map((s) => (
                      <span
                        key={s}
                        className="rounded border border-black/[0.08] bg-[#FAFBF8] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#181B15]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Colors */}
                <td className="px-4 py-4">
                  <div className="flex items-center -space-x-1.5">
                    {p.colors.map((color, i) => (
                      <span
                        key={`${color}-${i}`}
                        className="h-4 w-4 rounded-full border border-white shadow-sm ring-1 ring-black/10"
                        style={{ background: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </td>

                {/* Units / Stock */}
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-mono text-xs font-black ${
                          isOutOfStock
                            ? 'text-black/30'
                            : isLowStock
                              ? 'text-red-600'
                              : 'text-[#181B15]'
                        }`}
                      >
                        {p.units} units
                      </span>
                    </div>

                    {isLowStock && (
                      <div className="flex items-center gap-1 text-[9px] font-black text-red-600">
                        <AlertTriangle size={10} />
                        <span>Low stock</span>
                      </div>
                    )}

                    {p.warehouse ? (
                      <div className="flex items-center gap-1 text-[9px] font-medium text-black/40">
                        <MapPin size={9} />
                        <span>{p.warehouse}</span>
                      </div>
                    ) : null}
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                    {p.status}
                  </span>
                </td>

                {/* Tag */}
                <td className="px-4 py-4 pr-5">
                  {p.tag ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                      style={
                        p.tag === 'Bestseller'
                          ? { background: LIME, color: '#181B15' }
                          : p.tag === 'Featured'
                            ? { background: '#181B15', color: '#FFFFFF' }
                            : { background: '#E8EBE0', color: '#4E573C' }
                      }
                    >
                      {p.tag}
                    </span>
                  ) : (
                    <span className="text-black/20 text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}

          {!rows.length && (
            <tr>
              <td colSpan={10} className="py-20 text-center">
                <div className="mx-auto flex max-w-sm flex-col items-center">
                  <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#F0F2EB] text-[#555E45]">
                    <Boxes size={22} />
                  </span>
                  <p className="text-sm font-black uppercase tracking-wider text-[#181B15]">
                    No garments found
                  </p>
                  <p className="mt-1 text-xs text-black/45">
                    No catalog items matched your active search or filter criteria.
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
