import { useState } from 'react'
import useProductFilters from '../../hooks/useProductFilters'
import useProductReveal from '../../hooks/useProductReveal'
import { useCartStore } from '../../stores/cartStore'
import { LIME } from '../theme'
import ProductGrid from './ProductGrid'
import ProductHeading from './ProductHeading'
import ProductPagination from './ProductPagination'
import ProductPriceFilter from './ProductPriceFilter'
import ProductToolbar from './ProductToolbar'

export default function Product() {
  const {
    category,
    sort,
    maxPrice,
    currentPage,
    totalPages,
    filteredProducts,
    visibleProducts,
    changeCategory,
    changeSort,
    changeMaxPrice,
    goToPage,
    previousPage,
    nextPage,
    resetFilters,
  } = useProductFilters()

  const [showFilters, setShowFilters] = useState(false)

  // Shared cart/favourites: guests keep these through login and reloads.
  const favorites = useCartStore((s) => s.favourites)
  const cartCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.qty, 0),
  )
  const toggleFavorite = useCartStore((s) => s.toggleFavourite)
  const addProduct = useCartStore((s) => s.addProduct)

  // Key for the reveal hook: cards re-animate when the visible set changes.
  const sectionRef = useProductReveal<HTMLElement>(
    `${category}|${sort}|${maxPrice}|${currentPage}`,
  )

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-black px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12 lg:py-28"
    >
      {/* ---------- BACKDROP (same language as the hero artwork) ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* dot grid, fading out toward the edges */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1.3px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage:
              'radial-gradient(ellipse 70% 55% at 50% 22%, #000 0%, transparent 100%)',
            maskImage:
              'radial-gradient(ellipse 70% 55% at 50% 22%, #000 0%, transparent 100%)',
          }}
        />
        {/* neon glow, top right */}
        <div
          className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-[0.14] blur-3xl"
          style={{ background: LIME }}
        />
        {/* diagonal hairlines, like the hero's right edge */}
        <svg
          className="absolute right-0 top-0 h-[560px] w-[560px] text-white/15"
          viewBox="0 0 560 560"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path d="M560 0 330 560" />
          <path d="M560 120 450 560" />
          <path d="M560 260 520 560" />
        </svg>
        {/* ghost headline */}
        <span
          className="font-display absolute -left-6 top-6 select-none whitespace-nowrap font-black italic uppercase leading-none text-transparent"
          style={{
            fontSize: 'clamp(7rem, 19vw, 17rem)',
            WebkitTextStroke: '1px rgba(255,255,255,0.06)',
          }}
        >
          Top Picks
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-[1500px]">
        <ProductHeading
          currentPage={currentPage}
          totalPages={totalPages}
          onReset={resetFilters}
          onViewAll={() => changeCategory('All Products')}
          onPreviousPage={previousPage}
          onNextPage={nextPage}
        />

        <ProductToolbar
          category={category}
          onCategoryChange={changeCategory}
          sort={sort}
          onSortChange={changeSort}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((open) => !open)}
        />

        {showFilters && (
          <ProductPriceFilter
            maxPrice={maxPrice}
            onMaxPriceChange={changeMaxPrice}
          />
        )}

        {/* PRODUCT COUNT */}
        <div data-product-count className="mb-5 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Showing{' '}
            <span className="font-black text-white">{visibleProducts.length}</span>{' '}
            of{' '}
            <span className="font-black text-white">{filteredProducts.length}</span>{' '}
            products
          </p>

          {favorites.length > 0 && (
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: LIME }}
            >
              ♥ {favorites.length} Saved
            </p>
          )}
        </div>

        <ProductGrid
          products={visibleProducts}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onAddToCart={addProduct}
          onResetFilters={resetFilters}
        />

        {filteredProducts.length > 0 && (
          <ProductPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            cartCount={cartCount}
          />
        )}
      </div>
    </section>
  )
}