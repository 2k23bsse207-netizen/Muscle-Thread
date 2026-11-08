import type { ProductItem } from './productData'
import ProductCard from './ProductCard'
import { LIME } from '../theme'

type Props = {
  products: ProductItem[]
  favorites: number[]
  onToggleFavorite: (id: number) => void
  onAddToCart: (product: ProductItem) => void
  onResetFilters: () => void
}

export default function ProductGrid({
  products,
  favorites,
  onToggleFavorite,
  onAddToCart,
  onResetFilters,
}: Props) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-white/20 text-center">
        <p
          className="font-display text-3xl font-black uppercase italic text-transparent"
          style={{ WebkitTextStroke: `1.5px ${LIME}` }}
        >
          Nothing here
        </p>
        <p className="mt-3 text-sm text-white/60">
          Try changing your filters to see more products.
        </p>
        <button
          onClick={onResetFilters}
          className="-skew-x-12 mt-6 px-6 py-3 text-[10px] font-black uppercase tracking-wider text-black transition hover:brightness-110"
          style={{ backgroundColor: LIME }}
        >
          <span className="block skew-x-12">Clear Filters</span>
        </button>
      </div>
    )
  }

  return (
    <div
      data-product-grid
      className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isFavorite={favorites.includes(product.id)}
          onToggleFavorite={onToggleFavorite}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  )
}