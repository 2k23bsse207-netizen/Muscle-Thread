import { useMemo, useState } from "react";
import { PRODUCTS, PRODUCTS_PER_PAGE } from "../components/product/productData";

/**
 * All product filtering, sorting and pagination state.
 * Kept out of the component so the UI stays composition-only.
 */
export default function useProductFilters() {
  const [category, setCategory] = useState<string>("All Products");
  const [sort, setSort] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => {
    let result = PRODUCTS.filter((product) => {
      const matchesCategory =
        category === "All Products" || product.category === category;

      return matchesCategory && product.price <= maxPrice;
    });

    if (sort === "price-low") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      result = [...result].sort((a, b) => b.id - a.id);
    } else {
      result = [...result].sort(
        (a, b) => Number(b.featured) - Number(a.featured),
      );
    }

    return result;
  }, [category, sort, maxPrice]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE),
  );

  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  );

  // Every filter change resets to the first page (same as the original behaviour).
  const changeCategory = (value: string) => {
    setCategory(value);
    setCurrentPage(1);
  };

  const changeSort = (value: string) => {
    setSort(value);
    setCurrentPage(1);
  };

  const changeMaxPrice = (value: number) => {
    setMaxPrice(value);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => setCurrentPage(page);
  const previousPage = () =>
    setCurrentPage((page) => Math.max(1, page - 1));
  const nextPage = () =>
    setCurrentPage((page) => Math.min(totalPages, page + 1));

  const resetFilters = () => {
    setCategory("All Products");
    setSort("featured");
    setMaxPrice(100);
    setCurrentPage(1);
  };

  return {
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
  };
}
