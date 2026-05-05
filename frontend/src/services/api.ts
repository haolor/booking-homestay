import axios from 'axios';

/** Tránh nhầm VITE_API_BASE_BASE=.../api khiến URL thành .../api/api */
function normalizedApiRoot(raw: string | undefined): string {
  let base = (raw ?? '').trim();
  if (!base) return '/api';
  base = base.replace(/\/+$/, '');
  while (base.endsWith('/api')) base = base.replace(/\/api$/, '').replace(/\/+$/, '');
  return `${base}/api`;
}

export const api = axios.create({
  baseURL: normalizedApiRoot(import.meta.env.VITE_API_BASE_URL),
  headers: { 'Content-Type': 'application/json' },
});

type RetryableRequestConfig = {
  _retry?: boolean;
};

let refreshPromise: Promise<Tokens | null> | null = null;

/** Giống `django.contrib.auth.models.User.normalize_email`: trim + lowercase phần sau @ */
export function normalizeLoginEmail(raw: string): string {
  const email = raw.trim();
  const i = email.lastIndexOf('@');
  if (i <= 0 || i === email.length - 1) return email;
  return `${email.slice(0, i + 1)}${email.slice(i + 1).toLowerCase()}`;
}

export function formatApiError(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) {
    return error.code === 'ERR_NETWORK' || error.message === 'Network Error'
      ? 'Không kết nối được API (Network Error). Chạy backend tại :8000 hoặc chỉnh VITE_API_BASE_URL trong frontend/.env.'
      : fallback;
  }
  const data = error.response.data;
  if (data === undefined || data === null) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data !== 'object' || data === null) return fallback;
  const d = data as Record<string, unknown>;
  const parts: string[] = [];
  const detail = d.detail;
  if (typeof detail === 'string') parts.push(detail);
  else if (Array.isArray(detail)) {
    for (const x of detail) {
      parts.push(typeof x === 'string' ? x : JSON.stringify(x));
    }
  }
  for (const [key, val] of Object.entries(d)) {
    if (key === 'detail') continue;
    if (Array.isArray(val)) {
      const normalized = val.map((x) => {
        if (typeof x === 'string') return x;
        if (x && typeof x === 'object') {
          const rec = x as Record<string, unknown>;
          if (typeof rec.message === 'string') return rec.message;
          if (typeof rec.token_type === 'string') return rec.token_type;
        }
        return JSON.stringify(x);
      });
      parts.push(`${key}: ${normalized.join('; ')}`);
    }
    else if (val !== null && val !== undefined) parts.push(`${key}: ${String(val)}`);
  }
  const msg = parts.join(' ').trim();
  return msg || fallback;
}

api.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  const raw = localStorage.getItem('auth');
  if (raw) {
    try {
      const { access } = JSON.parse(raw) as { access?: string };
      if (access) {
        config.headers.Authorization = `Bearer ${access}`;
      }
    } catch {
      /* ignore */
    }
  }
  return config;
});

async function refreshAccessToken(): Promise<Tokens | null> {
  const current = getStoredTokens();
  if (!current?.refresh) return null;
  const res = await axios.post<{ access: string }>('/auth/refresh/', { refresh: current.refresh }, { baseURL: api.defaults.baseURL });
  const nextTokens: Tokens = { access: res.data.access, refresh: current.refresh };
  setStoredTokens(nextTokens);
  return nextTokens;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) throw error;
    const status = error.response?.status;
    const original = (error.config ?? {}) as typeof error.config & RetryableRequestConfig;
    const url = String(original.url ?? '');
    const isRefreshCall = url.includes('/auth/refresh/');
    if (status !== 401 || original._retry || isRefreshCall) throw error;

    try {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const tokens = await refreshPromise;
      if (!tokens?.access) {
        setStoredTokens(null);
        throw error;
      }
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${tokens.access}`;
      return api.request(original);
    } catch (refreshErr) {
      setStoredTokens(null);
      throw refreshErr;
    }
  },
);

export type Tokens = { access: string; refresh: string };

export function setStoredTokens(tokens: Tokens | null) {
  if (!tokens) localStorage.removeItem('auth');
  else localStorage.setItem('auth', JSON.stringify(tokens));
}

export function getStoredTokens(): Tokens | null {
  const raw = localStorage.getItem('auth');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Tokens;
  } catch {
    return null;
  }
}
