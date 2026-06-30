export type ApiResult<T> = {
  data: T;
  ok: boolean;
  status: number;
};

export type ApiOptions = RequestInit & {
  params?: Record<string, string>;
  skipAuth?: boolean;
  skipContentType?: boolean;
  /** Internal flag to prevent infinite retry loops on 401. */
  _isRetry?: boolean;
};

const JSON_CT = 'application/json';
const TOKEN_KEY = 'lm_market_token';
const REFRESH_TOKEN_KEY = 'lm_market_refresh_token';
const USER_KEY = 'lm_market_user';
const DEVICE_ID_KEY = 'lm_market_device_id';
const AUTH_LOGOUT_EVENT = 'auth:logout';

function resolveApiBase(): string {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000';
  }
  if (import.meta.env.VITE_DEV_REMOTE_API === 'true') {
    return import.meta.env.VITE_API_URL?.trim() || '';
  }
  return '';
}

const API_BASE = resolveApiBase();

const ABSOLUTE_URL = /^https?:\/\//i;

function buildHref(path: string, params?: Record<string, string>): string {
  const pathname = path.startsWith('/') ? path : `/${path}`;
  const url = ABSOLUTE_URL.test(path)
    ? new URL(path)
    : ABSOLUTE_URL.test(API_BASE)
      ? new URL(`${API_BASE.replace(/\/$/, '')}${pathname}`)
      : new URL(pathname, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.href;
}

/** Same URL rules as `api()` (dev: same-origin + Vite proxy; prod: `VITE_API_URL`). */
export function apiUrl(path: string): string {
  return buildHref(path);
}

function applyJsonContentType(headers: Headers, method: string, body: RequestInit['body'], skipContentType?: boolean): void {
  if (method === 'GET' || method === 'HEAD') return;
  if (skipContentType) return;
  if (headers.has('Content-Type')) return;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return;
  headers.set('Content-Type', JSON_CT);
}

async function parseResponseBody<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') ?? '';
  try {
    if (ct.includes(JSON_CT)) {
      return (await res.json()) as T;
    }
    return (await res.text()) as T;
  } catch {
    return { error: 'No se pudo leer la respuesta' } as T;
  }
}

/**
 * Get or create a stable device id for this browser. Persists across
 * logouts and reloads so the backend can track the same device.
 */
export function getDeviceId(): string {
  if (typeof localStorage === 'undefined') {
    return `web-${Math.random().toString(36).slice(2)}`;
  }
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      id = crypto.randomUUID();
    } else {
      id = `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/** Module-level dedup: parallel 401s share a single refresh call. */
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns true on success, false on any failure.
 */
export async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    try {
      const href = buildHref('/api/auth/refresh');
      const res = await fetch(href, {
        method: 'POST',
        headers: { 'Content-Type': JSON_CT },
        body: JSON.stringify({
          refreshToken,
          deviceId: getDeviceId(),
        }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as {
        accessToken?: string;
        refreshToken?: string;
      };
      if (!data.accessToken || !data.refreshToken) return false;
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Clear all auth-related storage and notify the AuthContext via a
 * custom DOM event so the user is logged out across the app.
 */
export function forceLogout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // deviceId is intentionally kept so the next login uses the same device.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
  }
}

async function doFetch<T>(href: string, init: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(href, init);
    const data = await parseResponseBody<T>(res);
    return { data, ok: res.ok, status: res.status };
  } catch {
    return {
      data: {
        error: 'No hay conexión con el servidor. ¿Está corriendo la API en el puerto 3000?',
      } as T,
      ok: false,
      status: 0,
    };
  }
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<ApiResult<T>> {
  const { params, skipAuth, skipContentType, _isRetry, ...init } = options;
  const href = buildHref(path, params);
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  applyJsonContentType(headers, method, init.body, skipContentType);
  if (!skipAuth) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const result = await doFetch<T>(href, { ...init, headers });

  // 401 interceptor: skip auth endpoints (login/register/refresh/logout) and
  // avoid infinite retry loops.
  const isAuthEndpoint = path.includes('/auth/');
  if (
    !result.ok &&
    result.status === 401 &&
    !skipAuth &&
    !isAuthEndpoint &&
    !_isRetry
  ) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Re-issue the request with the new access token.
      return api<T>(path, { ...options, _isRetry: true });
    }
    // Refresh failed: clear session and let the AuthContext redirect to login.
    forceLogout();
  }

  return result;
}
