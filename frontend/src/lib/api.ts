const API_BASE = "http://localhost:4000/api/v1";

export type Role = "USER" | "ADMIN";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
};

export type Session = { user: User; accessToken: string };

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Access token lives in memory only — never localStorage/sessionStorage.
// The refresh token lives in an HTTP-only cookie the browser sends itself.
let accessToken: string | null = null;

// Bumped on every token write. A refresh that started under an older epoch is
// stale: a newer login/logout won the race, so its response must be discarded.
let tokenEpoch = 0;

function commitAccessToken(token: string | null) {
  tokenEpoch += 1;
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** Lets the auth store keep its mirrored copy in sync (login, logout). */
export function setAccessToken(token: string | null) {
  commitAccessToken(token);
}

// The store registers these at module init — importing the store from here
// would create a circular import.
let onTokenRefreshed: ((token: string) => void) | null = null;
let onSessionLost: (() => void) | null = null;

export function setTokenRefreshedHandler(handler: (token: string) => void) {
  onTokenRefreshed = handler;
}

export function setSessionLostHandler(handler: () => void) {
  onSessionLost = handler;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  bearer?: boolean;
  allowRefresh?: boolean;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const { method = "GET", body, bearer = false, allowRefresh = false } = options;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers: {
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(bearer && accessToken
          ? { authorization: `Bearer ${accessToken}` }
          : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Is the backend running on port 4000?",
      0,
    );
  }

  // Expired/invalid access token on a protected request: refresh once, retry once
  if (res.status === 401 && allowRefresh && !isRetry && (await refreshOnce())) {
    return request<T>(path, options, true);
  }

  const payload = (await res.json().catch(() => null)) as
    | { message?: string }
    | null;

  if (!res.ok) {
    throw new ApiError(
      payload?.message ?? `Request failed with status ${res.status}`,
      res.status,
    );
  }

  return payload as T;
}

let inflightRefresh: Promise<Session | null> | null = null;

// Single-flight: refresh tokens rotate, so two parallel refreshes would make
// the second look like a replayed (revoked) token. Concurrent callers share one.
function refreshOnce(): Promise<Session | null> {
  inflightRefresh ??= doRefresh().finally(() => {
    inflightRefresh = null;
  });
  return inflightRefresh;
}

async function doRefresh(): Promise<Session | null> {
  const epoch = tokenEpoch;
  try {
    const session = await request<Session>("/auth/refresh", { method: "POST" });
    // Stale response: a newer token (login/logout) was written while we waited
    if (epoch !== tokenEpoch) return null;
    commitAccessToken(session.accessToken);
    onTokenRefreshed?.(session.accessToken);
    return session;
  } catch {
    // A stale failure must not wipe a newer login; otherwise clear everything
    if (epoch === tokenEpoch) {
      commitAccessToken(null);
      onSessionLost?.();
    }
    return null;
  }
}

/** On page load: exchanges the HTTP-only refresh cookie for a fresh session. */
export function restoreSession(): Promise<Session | null> {
  return refreshOnce();
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<Session> {
  const session = await request<Session>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  commitAccessToken(session.accessToken);
  return session;
}

export async function signupRequest(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: User; verificationToken?: string }> {
  return request("/auth/signup", { method: "POST", body: input });
}

/** Confirms the signup email with the code from the verification email. */
export async function verifyRequest(token: string): Promise<{ verified: boolean }> {
  return request("/auth/verify-email", { method: "POST", body: { token } });
}

/** Reissues the verification code. Always resolves `{ sent: true }` (no probing). */
export async function resendVerificationRequest(
  email: string,
): Promise<{ sent: boolean }> {
  return request("/auth/resend-verification", { method: "POST", body: { email } });
}

/** Revokes the server session and clears the refresh cookie (best-effort). */
export async function logoutRequest(): Promise<void> {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    // Local state is already cleared; an unreachable server must not block logout.
  }
}

/** Protected requests: Bearer header, credentials, silent refresh-and-retry on 401. */
export function authedRequest<T>(
  path: string,
  options: Omit<RequestOptions, "bearer" | "allowRefresh"> = {},
): Promise<T> {
  return request<T>(path, { ...options, bearer: true, allowRefresh: true });
}

// ---------------------------------------------------------------------------
// Resource fetchers for TanStack Query. Each is a thin wrapper over the
// request helpers above, so error handling (ApiError, refresh-retry) is shared.
// ---------------------------------------------------------------------------

/** Current signed-in user — mirrors `Session["user"]`. */
export function fetchMe(): Promise<{ user: User }> {
  return authedRequest<{ user: User }>("/auth/me");
}

// shortcut: the backend products/categories/orders routers are still empty
// stubs, so these response shapes are assumed — adjust them when the real
// endpoints land.
export type ProductListItem = {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  category?: string | null;
};

export type CategoryListItem = { id: string; name: string; slug?: string };

export type OrderListItem = {
  id: string;
  createdAt: string;
  total: number;
  status: string;
};

export function fetchProducts(): Promise<ProductListItem[]> {
  return request<ProductListItem[]>("/products");
}

export function fetchProduct(id: string): Promise<ProductListItem> {
  return request<ProductListItem>(`/products/${id}`);
}

export function fetchCategories(): Promise<CategoryListItem[]> {
  return request<CategoryListItem[]>("/categories");
}

export function fetchOrders(): Promise<OrderListItem[]> {
  return authedRequest<OrderListItem[]>("/orders");
}
