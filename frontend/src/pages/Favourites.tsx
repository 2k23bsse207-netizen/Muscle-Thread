import { Link } from "react-router-dom";
import { PRODUCTS } from "../components/product/productData";
import ProductGrid from "../components/product/ProductGrid";
import { useCartStore } from "../stores/cartStore";

export default function Favourites() {
  const favourites = useCartStore((s) => s.favourites);
  const toggleFavourite = useCartStore((s) => s.toggleFavourite);
  const addProduct = useCartStore((s) => s.addProduct);

  const products = PRODUCTS.filter((p) => favourites.includes(p.id));

  return (
    <main className="bg-[#f7f5ef] px-5 pb-16 pt-28 text-[#171717] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1500px]">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#666b58]">
          Saved for later
        </span>
        <h1 className="mt-2 font-display text-4xl font-black uppercase italic leading-[0.95] tracking-tight sm:text-5xl">
          Favourites
        </h1>

        <div className="mt-8">
          {products.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center border border-dashed border-[#d8d5cc] text-center">
              <p className="font-display text-xl font-bold uppercase">
                No favourites yet
              </p>
              <p className="mt-2 text-sm text-[#77766e]">
                Tap the heart on any product to save it here.
              </p>
              <Link
                to="/shop"
                className="mt-5 bg-[#242421] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <ProductGrid
              products={products}
              favorites={favourites}
              onToggleFavorite={toggleFavourite}
              onAddToCart={addProduct}
              onResetFilters={() => undefined}
            />
          )}
        </div>
      </div>
    </main>
  );
}
