export type ApiResult<T> = {
  data: T;
  ok: boolean;
  status: number;
};

export type ApiOptions = RequestInit & {
  params?: Record<string, string>;
  skipAuth?: boolean;
  skipContentType?: boolean;
};

const JSON_CT = 'application/json';

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

export async function api<T>(path: string, options: ApiOptions = {}): Promise<ApiResult<T>> {
  const { params, skipAuth, skipContentType, ...init } = options;
  const href = buildHref(path, params);
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  applyJsonContentType(headers, method, init.body, skipContentType);
  if (!skipAuth) {
    const token = localStorage.getItem('lm_market_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  try {
    const res = await fetch(href, { ...init, headers });
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
