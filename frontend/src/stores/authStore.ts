import { create } from "zustand";

import {
  logoutRequest,
  setAccessToken as setApiAccessToken,
  setSessionLostHandler,
  setTokenRefreshedHandler,
} from "../lib/api";
import type { Session } from "../lib/api";
import { queryClient } from "../lib/queryClient";
import { queryKeys } from "../lib/queryKeys";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

// Private = per-account server data only. Public caches (products, categories)
// and the guest cart/favourites in cartStore are deliberately untouched.
// removeQueries cancels in-flight fetches too, so a stale response can never
// land after an account switch.
function resetPrivateQueries() {
  queryClient.removeQueries({ queryKey: queryKeys.me });
  queryClient.removeQueries({ queryKey: queryKeys.orders.all });
}

// Deliberately holds NO user data: `name`/`email`/`role` are server data and
// live in TanStack Query (`useMe()`), so there is a single copy of them.
type AuthState = {
  accessToken: string | null;
  status: AuthStatus;
  setAuth: (session: Session) => void;
  setAccessToken: (token: string | null) => void;
  setStatus: (status: AuthStatus) => void;
  logout: () => void;
};

// No persist middleware: the access token must stay in memory only.
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  status: "loading",

  setAuth: (session) => {
    setApiAccessToken(session.accessToken);
    // Drop the previous account's private caches before this session is
    // visible, so a second login can never show the first user's /me/orders
    // (removeQueries also cancels their in-flight fetches).
    resetPrivateQueries();
    // Session.user is ignored here on purpose — flipping status to
    // "authenticated" is what enables useMe() to fetch the user.
    set({ accessToken: session.accessToken, status: "authenticated" });
  },

  setAccessToken: (token) => {
    setApiAccessToken(token);
    set({ accessToken: token });
  },

  setStatus: (status) => set({ status }),

  logout: () => {
    setApiAccessToken(null);
    set({ accessToken: null, status: "unauthenticated" });
    // Drop cached authed server data (/me, orders) so it can't outlive the
    // session or show one account's data to the next. Cart/favourites are
    // guest data in cartStore and stay untouched.
    resetPrivateQueries();
    // Revoke the refresh-cookie session too, or the next reload would log
    // the user straight back in. Best-effort: local state is already cleared.
    void logoutRequest();
  },
}));

// Report API-client token/session changes back into the store. Registered at
// module init because api.ts must not import the store (circular dependency).
setTokenRefreshedHandler((token) => useAuthStore.setState({ accessToken: token }));
setSessionLostHandler(() => useAuthStore.getState().logout());
