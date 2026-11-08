import { LIME } from '../theme'

type Props = {
  currentPage: number
  totalPages: number
  onReset: () => void
  onViewAll: () => void
  onPreviousPage: () => void
  onNextPage: () => void
}

const pad = (n: number) => String(n).padStart(2, '0')

const arrowBtnCls =
  '-skew-x-12 flex h-11 w-11 items-center justify-center border border-white/25 text-white transition hover:border-transparent hover:text-black disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/25 disabled:hover:bg-transparent disabled:hover:text-white'

export default function ProductHeading({
  currentPage,
  totalPages,
  onReset,
  onViewAll,
  onPreviousPage,
  onNextPage,
}: Props) {
  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0

  return (
    <div className="mb-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
      <div data-product-heading className="max-w-2xl">
        {/* eyebrow: the logo slashes + label */}
        <div className="mb-4 flex items-center gap-3">
          <svg viewBox="0 0 62 30" className="h-4 w-auto" aria-hidden="true" fill={LIME}>
            <path d="M14 0h20L20 30H0z" />
            <path d="M42 0h20L48 30H28z" />
          </svg>
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-white/80">
            Best Sellers
          </span>
        </div>

        {/* headline mirrors the hero: neon outline + solid white */}
        <h2 className="font-display text-6xl font-black uppercase italic leading-[0.88] tracking-tight sm:text-7xl lg:text-8xl">
          <span
            className="block text-transparent"
            style={{ WebkitTextStroke: `2px ${LIME}` }}
          >
            Top
          </span>
          <span className="block text-white">Picks</span>
        </h2>

        <p
          className="mt-6 max-w-md border-l-2 pl-4 text-sm leading-6 text-white/70"
          style={{ borderColor: LIME }}
        >
          Our most battle-tested pieces, engineered for maximum mechanical
          output and durability.
        </p>
      </div>

      <div data-product-actions className="flex flex-col items-start gap-5 lg:items-end">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onReset}
            className="-skew-x-12 border border-white/25 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-white/10"
          >
            <span className="block skew-x-12">Reset Filters ↻</span>
          </button>

          <a
            href="#all-products"
            onClick={onViewAll}
            className="-skew-x-12 px-6 py-3 text-[10px] font-black uppercase tracking-wider text-black transition hover:brightness-110"
            style={{ backgroundColor: LIME }}
          >
            <span className="block skew-x-12">View All Products →</span>
          </a>
        </div>

        {/* counter + arrows: echoes the hero's 01 — 03 pagination */}
        <div className="flex items-center gap-5">
          <div className="font-display flex items-center gap-3">
            <span className="text-2xl font-black italic text-white">{pad(currentPage)}</span>
            <span className="relative block h-px w-20 bg-white/25">
              <span
                className="absolute inset-y-0 left-0 block transition-all duration-500"
                style={{ width: `${progress}%`, background: LIME }}
              />
            </span>
            <span className="text-sm font-medium text-white/40">{pad(totalPages)}</span>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={onPreviousPage}
              className={`${arrowBtnCls} hover:bg-[var(--lime)]`}
              style={{ ['--lime' as string]: LIME }}
            >
              <span className="skew-x-12 text-lg">‹</span>
            </button>
            <button
              aria-label="Next page"
              disabled={currentPage === totalPages}
              onClick={onNextPage}
              className={`${arrowBtnCls} hover:bg-[var(--lime)]`}
              style={{ ['--lime' as string]: LIME }}
            >
              <span className="skew-x-12 text-lg">›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}