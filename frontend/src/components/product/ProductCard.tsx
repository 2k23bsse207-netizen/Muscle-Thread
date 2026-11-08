import { Link } from 'react-router-dom'
import { LIME } from '../theme'
import type { ProductItem } from './productData'

type Props = {
  product: ProductItem
  isFavorite: boolean
  onToggleFavorite: (id: number) => void
  onAddToCart: (product: ProductItem) => void
}

// Slashed corners (top-right + bottom-left), echoing the logo and hero card
const cut = (px: number) =>
  `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, ${px}px 100%, 0 calc(100% - ${px}px))`

export default function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
}: Props) {
  const number = String(product.id).padStart(2, '0')

  return (
    <article
      data-product-card
      className="group relative min-w-0 p-px transition-transform duration-300 hover:-translate-y-1.5"
      style={{
        clipPath: cut(26),
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.14))',
      }}
    >
      {/* neon border that fades in on hover */}
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${LIME}, rgba(0,0,0,0) 55%, ${LIME})`,
        }}
      />

      <div
        className="relative overflow-hidden bg-[#0b0b0b]"
        style={{ clipPath: cut(25) }}
      >
        {/* IMAGE */}
        <div
          className="relative aspect-[4/4.7] overflow-hidden"
          style={{
            background: `radial-gradient(circle at 50% 95%, ${LIME}30, transparent 62%), linear-gradient(#1d1d1d, #0b0b0b)`,
          }}
        >
          {/* dot grid, like the hero */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1.3px)',
              backgroundSize: '16px 16px',
            }}
          />

          <Link
            to={`/product/${product.id}`}
            aria-label={product.name}
            className="relative block h-full w-full"
          >
            <img
              data-product-image
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              onError={(e) => {
                e.currentTarget.style.opacity = '0'
              }}
            />
          </Link>

          {/* fade the photo into the details area */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0b0b0b] to-transparent"
          />

          {/* outlined index number */}
          <span
            aria-hidden="true"
            className="font-display pointer-events-none absolute bottom-1 left-4 select-none text-6xl font-black italic leading-none text-transparent"
            style={{ WebkitTextStroke: `1px ${LIME}` }}
          >
            {number}
          </span>

          {/* Badge */}
          {product.badge && (
            <span
              className="absolute left-0 top-4 -skew-x-12 py-1.5 pl-5 pr-3 text-[9px] font-black uppercase tracking-widest text-black"
              style={{ backgroundColor: LIME }}
            >
              <span className="block skew-x-12">{product.badge}</span>
            </span>
          )}

          {/* Wishlist */}
          <button
            type="button"
            onClick={() => onToggleFavorite(product.id)}
            aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isFavorite}
            className="absolute right-8 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-lg backdrop-blur-sm transition hover:scale-110 hover:border-white/50"
          >
            <span className={isFavorite ? 'text-red-500' : 'text-white'}>
              {isFavorite ? '♥' : '♡'}
            </span>
          </button>

          {/* Quick Add slab */}
          <button
            onClick={() => onAddToCart(product)}
            className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between px-5 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-transform duration-300 group-hover:translate-y-0 focus-visible:translate-y-0"
            style={{ backgroundColor: LIME }}
          >
            Quick Add
            <span className="text-base leading-none">+</span>
          </button>
        </div>

        {/* PRODUCT DETAILS */}
        <div className="relative px-4 pb-5 pt-3 sm:px-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="truncate text-[9px] font-semibold uppercase tracking-[0.2em] text-white/50">
              <span style={{ color: LIME }}>//</span> {product.collection}
            </span>

            <div className="flex shrink-0 items-center gap-1.5">
              {product.colors.map((color, index) => (
                <span
                  key={`${product.id}-${index}`}
                  className="h-2.5 w-2.5 -skew-x-12 border border-white/30"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <h3 className="font-display truncate text-base font-bold uppercase italic tracking-tight text-white">
            <Link to={`/product/${product.id}`} className="hover:underline">
              {product.name}
            </Link>
          </h3>

          <div className="mt-4 flex items-end justify-between gap-2">
            <p className="font-display text-3xl font-black italic leading-none tracking-tight text-white">
              <span className="mr-0.5 align-top text-sm" style={{ color: LIME }}>
                $
              </span>
              {product.price.toFixed(2)}
            </p>

            <button
              onClick={() => onAddToCart(product)}
              aria-label={`Add ${product.name} to cart`}
              className="-skew-x-12 flex h-10 w-10 shrink-0 items-center justify-center text-black transition hover:scale-105 hover:brightness-110"
              style={{ backgroundColor: LIME }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 skew-x-12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 8H6" />
                <circle cx="10" cy="21" r="1" />
                <circle cx="18" cy="21" r="1" />
                <path d="M14 8v6m-3-3h6" />
              </svg>
            </button>
          </div>

          {/* neon underline that sweeps in on hover */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
            style={{ backgroundColor: LIME }}
          />
        </div>
      </div>
    </article>
  )
}