// Central query-key factory. Every key in the app goes through here so
// invalidation and cache clearing can target whole slices (`queryKeys.me`,
// `queryKeys.orders.all`) without stringly-typed drift.
export const queryKeys = {
  /** Current signed-in user (`GET /auth/me`). */
  me: ["me"] as const,

  products: {
    all: ["products"] as const,
    list: () => ["products", "list"] as const,
    detail: (id: string) => ["products", "detail", id] as const,
  },

  categories: ["categories"] as const,

  orders: {
    all: ["orders"] as const,
    list: () => ["orders", "list"] as const,
  },
};
