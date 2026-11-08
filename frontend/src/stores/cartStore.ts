import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ProductItem } from "../components/product/productData";

export type CartLine = {
  key: string; // unique per product/variant (e.g. "1" or "1-Stealth Onyx-M")
  id: number; // catalog product id
  name: string;
  price: number;
  image: string;
  meta: string;
  qty: number;
};

type CartState = {
  items: CartLine[];
  favourites: number[];
  addItem: (line: CartLine) => void;
  addProduct: (product: ProductItem) => void;
  setQty: (key: string, delta: number) => void;
  removeItem: (key: string) => void;
  toggleFavourite: (id: number) => void;
};

// Guest cart/favourites persist in localStorage so they survive login and
// reloads. No auth tokens are ever written here — only product data.
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      favourites: [],

      addItem: (line) =>
        set((state) => {
          const existing = state.items.find((i) => i.key === line.key);
          if (!existing) return { items: [...state.items, line] };
          return {
            items: state.items.map((i) =>
              i.key === line.key ? { ...i, qty: i.qty + line.qty } : i,
            ),
          };
        }),

      addProduct: (product) =>
        set((state) => {
          const key = String(product.id);
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, qty: i.qty + 1 } : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                key,
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                meta: product.collection,
                qty: 1,
              },
            ],
          };
        }),

      setQty: (key, delta) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.key === key ? { ...i, qty: Math.max(1, i.qty + delta) } : i,
          ),
        })),

      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

      toggleFavourite: (id) =>
        set((state) => ({
          favourites: state.favourites.includes(id)
            ? state.favourites.filter((f) => f !== id)
            : [...state.favourites, id],
        })),
    }),
    { name: "move-cart" },
  ),
);
