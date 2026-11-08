import {
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  categories,
  emptyFilters,
  prices,
  statuses,
  tags,
  type Filters,
} from './Data';

export type { Filters };


function FilterSelect({
  title,
  value,
  options,
  onChange,
  isFiltered,
}: {
  title: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  isFiltered: boolean;
}) {
  return (
    <label
      className={`relative flex min-w-[130px] flex-1 sm:flex-initial items-center gap-2 rounded-xl border px-3 py-2 transition-all ${
        isFiltered
          ? 'border-[#181B15] bg-[#F3F5EC] shadow-sm'
          : 'border-black/[0.08] bg-white hover:border-black/20'
      }`}
    >
      <span
        className={`shrink-0 text-[9px] font-black uppercase tracking-wider ${
          isFiltered ? 'text-[#181B15]' : 'text-black/40'
        }`}
      >
        {title}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none bg-transparent py-1 pr-5 text-xs font-bold text-[#181B15] outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className={`pointer-events-none absolute right-2.5 transition-colors ${
          isFiltered ? 'text-[#181B15]' : 'text-black/35'
        }`}
      />
    </label>
  );
}

export default function FilterBar({
  f,
  set,
}: {
  f: Filters;
  set: (f: Filters) => void;
}) {
  const up = (p: Partial<Filters>) => set({ ...f, ...p });

  const activeCount = [
    Boolean(f.q),
    f.category !== 'All',
    f.status !== 'All',
    f.tag !== 'Any',
    f.price !== 'All',
  ].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:p-5">
      {/* Top Header of Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#F0F2E9] text-[#555E45]">
            <SlidersHorizontal size={15} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black uppercase tracking-wider text-[#181B15]">
                Filter Catalog
              </p>
              {activeCount > 0 && (
                <span className="rounded-full bg-[#181B15] px-2 py-0.5 text-[9px] font-black text-white">
                  {activeCount} ACTIVE
                </span>
              )}
            </div>
            <p className="text-[10px] text-black/40">Refine by SKU, collection status, tag, and price</p>
          </div>
        </div>

        {activeCount > 0 && (
          <button
            onClick={() => set(emptyFilters)}
            className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-[#F7F8F4] px-3 py-1.5 text-[10px] font-bold text-[#181B15] transition hover:bg-black hover:text-white"
          >
            <RotateCcw size={11} />
            Reset all
          </button>
        )}
      </div>

      {/* Filter Controls Grid */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <label className="relative flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-black/[0.08] bg-[#F8F9F5] px-3 py-2 transition-all focus-within:border-[#181B15] focus-within:bg-white focus-within:shadow-sm">
          <Search size={15} className="shrink-0 text-black/40" />
          <input
            value={f.q}
            onChange={(e) => up({ q: e.target.value })}
            placeholder="Search by SKU, style, or garment..."
            className="w-full bg-transparent text-xs font-semibold text-[#181B15] outline-none placeholder:text-black/35"
          />
          {f.q ? (
            <button
              type="button"
              onClick={() => up({ q: '' })}
              className="rounded-full p-1 text-black/40 hover:bg-black/10 hover:text-black"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex rounded border border-black/10 bg-black/[0.04] px-1.5 py-0.5 text-[9px] font-mono font-bold text-black/40">
              ⌘K
            </kbd>
          )}
        </label>

        {/* Dropdowns */}
        <FilterSelect
          title="Category"
          value={f.category}
          options={categories}
          onChange={(category) => up({ category })}
          isFiltered={f.category !== 'All'}
        />
        <FilterSelect
          title="Status"
          value={f.status}
          options={statuses}
          onChange={(status) => up({ status })}
          isFiltered={f.status !== 'All'}
        />
        <FilterSelect
          title="Tag"
          value={f.tag}
          options={tags}
          onChange={(tag) => up({ tag })}
          isFiltered={f.tag !== 'Any'}
        />
        <FilterSelect
          title="Price"
          value={f.price}
          options={prices}
          onChange={(price) => up({ price })}
          isFiltered={f.price !== 'All'}
        />
      </div>
    </div>
  );
}
