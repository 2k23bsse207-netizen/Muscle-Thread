import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Package,
  Plus,
} from 'lucide-react';
import { LIME } from '../../theme';
import AdminLayout from './Adminlayout';
import StatCards from './Statcards';
import FilterBar from './Filterbar';
import ProductTable from './Producttable';
import {
  LOW_STOCK_AT,
  PAGE_SIZE,
  emptyFilters,
  products,
  type Filters,
} from './Data';

const inRange = (price: number, range: string) =>
  range === 'All' ||
  (range === 'Under $50'
    ? price < 50
    : range === 'Over $100'
      ? price > 100
      : price >= 50 && price <= 100);

export default function ProductsPage() {
  const [f, setF] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const bar = useRef<HTMLDivElement>(null);

  const handleFilterChange = (newFilters: Filters) => {
    setF(newFilters);
    setPage(1);
    setSelected([]);
  };

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (!f.q ||
            `${p.name} ${p.sku}`.toLowerCase().includes(f.q.toLowerCase())) &&
          (f.category === 'All' || p.category === f.category) &&
          (f.status === 'All' || p.status === f.status) &&
          (f.tag === 'Any' || p.tag === f.tag) &&
          inRange(p.price, f.price)
      ),
    [f]
  );

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.units > 0 && p.units <= LOW_STOCK_AT).length,
    []
  );

  useEffect(() => {
    if (!bar.current) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      bar.current.style.opacity = selected.length ? '1' : '0';
      bar.current.style.transform = 'translateY(0)';
      return;
    }

    const tween = gsap.to(bar.current, {
      y: selected.length ? 0 : 25,
      opacity: selected.length ? 1 : 0,
      duration: 0.28,
      ease: 'power3.out',
    });

    return () => {
      tween.kill();
    };
  }, [selected.length]);

  const toggle = (sku: string) => {
    setSelected((current) =>
      current.includes(sku)
        ? current.filter((item) => item !== sku)
        : [...current, sku]
    );
  };

  const toggleAll = () => {
    setSelected((current) =>
      rows.every((r) => current.includes(r.sku))
        ? current.filter((sku) => !rows.some((r) => r.sku === sku))
        : [...new Set([...current, ...rows.map((r) => r.sku)])]
    );
  };

  const exportCsv = () => {
    const head = 'sku,name,category,price,units,status,tag';

    const escapeCsv = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const lines = filtered.map((p) =>
      [
        p.sku,
        p.name,
        p.category,
        p.price,
        p.units,
        p.status,
        p.tag ?? '',
      ]
        .map(escapeCsv)
        .join(',')
    );

    const blob = new Blob([[head, ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `move-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout active="Products">
      {/* Top Breadcrumb & Status Beacon */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold text-black/45">
          <Package size={13} className="text-[#555E45]" />
          <span>Workspace</span>
          <span className="text-black/25">/</span>
          <span className="font-black text-[#181B15]">Products</span>
          <span className="rounded-md bg-[#EDF0E4] px-2 py-0.5 text-[8px] font-black tracking-widest text-[#525D3B]">
            CATALOG HUB
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 py-1 shadow-xs">
          <span
            className="h-2 w-2 rounded-full animate-pulse"
            style={{ background: LIME }}
          />
          <span className="text-[9px] font-black uppercase tracking-widest text-[#181B15]">
            Inventory System Online
          </span>
        </div>
      </div>

      {/* Main Page Title & Primary Actions */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black uppercase tracking-tight text-[#181B15] sm:text-4xl">
              Products
            </h1>
            <span className="rounded-xl bg-[#181B15] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-xs">
              {products.length} Garments
            </span>
          </div>

          <p className="mt-2 max-w-xl text-xs leading-relaxed text-[#181B15]/60 sm:text-sm">
            Manage your apparel catalog, monitor warehouse inventory levels, and organize your seasonal collection drops.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#181B15] shadow-xs transition hover:bg-[#F0F2EB]"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#181B15] shadow-sm transition hover:brightness-95 active:scale-[0.98]"
            style={{ background: LIME }}
          >
            <Plus size={15} />
            Add garment
          </button>
        </div>
      </div>

      {/* Stat Cards Row */}
      <StatCards />

      {/* Filter Bar */}
      <div className="my-7">
        <FilterBar f={f} set={handleFilterChange} />
      </div>

      {/* Product Inventory Table Card */}
      <section className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] bg-white px-6 py-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-[#181B15]">
              Garment Catalog
            </h2>
            <p className="mt-0.5 text-[10px] text-black/45">
              Current stock availability, colorways, and collection distribution
            </p>
          </div>

          <div className="flex items-center gap-2">
            {lowStockCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-red-600">
                <AlertTriangle size={11} />
                {lowStockCount} Low Stock
              </span>
            )}
            <span className="rounded-lg bg-[#F0F2E9] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-[#525D3B]">
              {filtered.length} Results
            </span>
          </div>
        </div>

        <ProductTable
          rows={rows}
          selected={selected}
          onToggle={toggle}
          onToggleAll={toggleAll}
        />

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] bg-[#FAFAF7] px-6 py-4">
          <p className="text-xs text-black/50">
            Showing{' '}
            <strong className="font-bold text-[#181B15]">
              {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0}–
              {(page - 1) * PAGE_SIZE + rows.length}
            </strong>{' '}
            of <strong className="font-bold text-[#181B15]">{filtered.length}</strong>{' '}
            garments
          </p>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
              className="grid h-8 w-8 place-items-center rounded-xl border border-black/[0.08] bg-white text-[#181B15] transition hover:bg-[#F0F2E9] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: pages }, (_, i) => {
              const pageNumber = i + 1;
              const isActive = page === pageNumber;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`grid h-8 min-w-8 place-items-center rounded-xl px-2 font-mono text-xs font-black transition ${
                    isActive
                      ? 'shadow-xs'
                      : 'border border-transparent text-black/50 hover:border-black/10 hover:bg-white hover:text-black'
                  }`}
                  style={
                    isActive
                      ? { background: LIME, color: '#181B15' }
                      : undefined
                  }
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              disabled={page === pages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
              className="grid h-8 w-8 place-items-center rounded-xl border border-black/[0.08] bg-white text-[#181B15] transition hover:bg-[#F0F2E9] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Floating Bulk Action Dock */}
      <div
        ref={bar}
        className={`pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 ${
          selected.length ? '' : 'invisible'
        }`}
        style={{ opacity: 0, transform: 'translateY(25px)' }}
      >
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 sm:gap-4 rounded-2xl border border-white/10 bg-[#181B15] px-5 py-3 text-xs font-bold text-white shadow-2xl backdrop-blur-md">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
            style={{ background: LIME, color: '#181B15' }}
          >
            {selected.length} Selected
          </span>
          <span className="h-4 w-px bg-white/15" />
          <button
            type="button"
            className="transition hover:text-[#C8F31D]"
          >
            Archive Selected
          </button>
          <span className="h-4 w-px bg-white/15" />
          <button
            type="button"
            className="transition hover:text-[#C8F31D]"
          >
            Bulk Set Status
          </button>
          <span className="h-4 w-px bg-white/15" />
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-white/45 transition hover:text-white"
          >
            Deselect All
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
