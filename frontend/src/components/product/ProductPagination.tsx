import { LIME } from '../theme'

type Props = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  cartCount: number
}

const navBtnCls =
  '-skew-x-12 h-11 border border-white/20 px-5 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white'

export default function ProductPagination({
  currentPage,
  totalPages,
  onPageChange,
  cartCount,
}: Props) {
  return (
    <div
      data-product-pagination
      className="mt-12 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-7 sm:flex-row"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
        Page <span className="font-black text-white">{currentPage}</span> of{' '}
        {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={navBtnCls}
        >
          <span className="block skew-x-12">← Prev</span>
        </button>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (page) => {
            const active = currentPage === page
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={active ? 'page' : undefined}
                className={`-skew-x-12 h-11 w-11 text-xs font-black transition ${
                  active
                    ? 'text-black'
                    : 'border border-white/20 text-white hover:bg-white/10'
                }`}
                style={active ? { backgroundColor: LIME } : undefined}
              >
                <span className="block skew-x-12">{page}</span>
              </button>
            )
          },
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={navBtnCls}
        >
          <span className="block skew-x-12">Next →</span>
        </button>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
        <span className="font-black" style={{ color: LIME }}>
          {cartCount}
        </span>{' '}
        items in cart
      </p>
    </div>
  )
}