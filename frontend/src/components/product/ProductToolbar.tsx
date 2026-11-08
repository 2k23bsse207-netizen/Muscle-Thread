import { CATEGORIES } from './productData'
import { LIME } from '../theme'

type Props = {
  category: string
  onCategoryChange: (value: string) => void
  sort: string
  onSortChange: (value: string) => void
  showFilters: boolean
  onToggleFilters: () => void
}

export default function ProductToolbar({
  category,
  onCategoryChange,
  sort,
  onSortChange,
  showFilters,
  onToggleFilters,
}: Props) {
  return (
    <div
      id="all-products"
      data-product-toolbar
      className="mb-7 flex flex-col gap-4 border-y border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        {CATEGORIES.map((item) => {
          const active = category === item
          return (
            <button
              key={item}
              onClick={() => onCategoryChange(item)}
              aria-pressed={active}
              className={`-skew-x-12 border px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition ${
                active
                  ? 'border-transparent text-black'
                  : 'border-white/20 text-white/70 hover:border-white/60 hover:text-white'
              }`}
              style={active ? { backgroundColor: LIME } : undefined}
            >
              <span className="block skew-x-12">{item}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onToggleFilters}
          aria-expanded={showFilters}
          className="-skew-x-12 flex h-10 items-center border border-white/20 px-4 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-white/10"
        >
          <span className="flex skew-x-12 items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 6h16M7 12h10m-7 6h4" />
            </svg>
            Filters
            <span style={{ color: LIME }}>{showFilters ? '−' : '+'}</span>
          </span>
        </button>

        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/60">
          Sort By
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-10 border border-white/20 bg-black px-3 text-[10px] font-bold text-white outline-none focus:border-[color:var(--lime)]"
            style={{ ['--lime' as string]: LIME }}
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </label>
      </div>
    </div>
  )
}