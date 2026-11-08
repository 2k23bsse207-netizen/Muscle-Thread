import { useState } from "react";
import { PRODUCTS } from "../components/product/productData";
import ProductGrid from "../components/product/ProductGrid";
import { useCartStore } from "../stores/cartStore";

export default function Search() {
  const [query, setQuery] = useState("");
  const favourites = useCartStore((s) => s.favourites);
  const toggleFavourite = useCartStore((s) => s.toggleFavourite);
  const addProduct = useCartStore((s) => s.addProduct);

  const q = query.trim().toLowerCase();
  const results = q
    ? PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.collection.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      )
    : PRODUCTS;

  return (
    <main className="bg-[#f7f5ef] px-5 pb-16 pt-28 text-[#171717] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1500px]">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#666b58]">
          Find your gear
        </span>
        <h1 className="mt-2 font-display text-4xl font-black uppercase italic leading-[0.95] tracking-tight sm:text-5xl">
          Search
        </h1>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, collections, categories..."
          aria-label="Search products"
          className="mt-6 w-full max-w-xl border border-[#dedbd2] bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#999] focus:border-[#171914]"
        />

        <p className="mt-4 mb-4 text-[10px] font-semibold uppercase tracking-widest text-[#77766e]">
          {results.length} {results.length === 1 ? "product" : "products"}
          {q ? ` for "${query.trim()}"` : ""}
        </p>

        <ProductGrid
          products={results}
          favorites={favourites}
          onToggleFavorite={toggleFavourite}
          onAddToCart={addProduct}
          onResetFilters={() => setQuery("")}
        />
      </div>
    </main>
  );
}
