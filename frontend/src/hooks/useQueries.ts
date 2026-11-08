import { useQuery } from "@tanstack/react-query";

import {
  fetchCategories,
  fetchMe,
  fetchOrders,
  fetchProduct,
  fetchProducts,
} from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { useAuthStore } from "../stores/authStore";

/**
 * Current user (`GET /auth/me`).
 *
 * `enabled` gates on auth status: while session restoration is still running
 * (`"loading"`) the query stays disabled, so `/me` only fires once the refresh
 * exchange has settled — and only for signed-in users.
 */
export function useMe() {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    enabled: status === "authenticated",
  });
}

/** Public catalog list. */
export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.list(),
    queryFn: fetchProducts,
  });
}

/** Public catalog detail; waits for a real id from the route. */
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.detail(id ?? "unknown"),
    queryFn: () => fetchProduct(id!),
    enabled: Boolean(id),
  });
}

/** Public category list. */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
  });
}

/** The signed-in user's orders — same gating as `useMe`. */
export function useOrders() {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: queryKeys.orders.list(),
    queryFn: fetchOrders,
    enabled: status === "authenticated",
  });
}
