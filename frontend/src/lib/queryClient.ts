import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "./api";

// One centralized client for all server data. Auth stays in Zustand; the
// cart/favourites stay in cartStore — neither of these belongs here.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Server data is fresh for a minute: badge-level re-renders won't
      // refetch on every navigation.
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      // Retry transient failures (network blips, 5xx) twice. Never retry
      // 4xx — a 404/403/401 is a real answer, not a flake.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        failureCount < 2,
    },
  },
});

// Console debugging in dev only (`queryClient.getQueryState(...)` etc.).
// Stripped from production behaviour: the branch never runs there.
if (import.meta.env.DEV) {
  (window as Window & { queryClient?: QueryClient }).queryClient = queryClient;
}
