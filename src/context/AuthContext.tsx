import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { apiUrl, getDeviceId, tryRefreshToken } from '../api/client';
import { disconnectSocket } from '../realtime/socket';

const TOKEN_KEY = 'lm_market_token';
const REFRESH_TOKEN_KEY = 'lm_market_refresh_token';
const USER_KEY = 'lm_market_user';
const AUTH_LOGOUT_EVENT = 'auth:logout';
const REFRESH_INTERVAL_MS = 50 * 60 * 1000;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  numberId: string;
  type: string;
  address?: string;
  phone?: string;
}

interface AuthState {
  isLoading: boolean;
  token: string | null;
  user: User | null;
}

interface AuthContextValue extends AuthState {
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  register: (data: {
    email: string;
    password: string;
    numberId: string;
    numberIdType: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<{ error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ error?: string }>;
  updateProfile: (data: {
    address?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function request<T>(
  path: string,
  body: unknown,
  method: string = 'POST'
): Promise<{ data?: T; error?: string; status: number }> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(apiUrl(path), {
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method,
  });
  const data = await res.json().catch(() => ({}));
  return {
    data: data as T,
    error: data.error ?? (res.ok ? undefined : 'Request failed'),
    status: res.status,
  };
}

async function getRequest<T>(path: string): Promise<{ data?: T; error?: string; status: number }> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(apiUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    method: 'GET',
  });
  const data = await res.json().catch(() => ({}));
  return {
    data: data as T,
    error: data.error ?? (res.ok ? undefined : 'Request failed'),
    status: res.status,
  };
}

function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    token: null,
    user: null,
  });

  // Listen for forced logout events from the api() interceptor.
  useEffect(() => {
    const handler = () => {
      disconnectSocket();
      setState({ isLoading: false, token: null, user: null });
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, handler);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler);
  }, []);

  // On mount: if a refresh token is present, try to refresh first so the
  // user has a fresh access token before we validate against /me.
  useEffect(() => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const accessToken = localStorage.getItem(TOKEN_KEY);

    const init = async () => {
      if (refreshToken) {
        // Proactive refresh on mount: extends the session before any request.
        await tryRefreshToken();
      }
      const newAccessToken = localStorage.getItem(TOKEN_KEY);
      if (!newAccessToken) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }
      const { data, status } = await getRequest<{ user: User }>('/api/auth/me');
      if (status === 401) {
        clearAuthStorage();
        setState({ isLoading: false, token: null, user: null });
        return;
      }
      if (status === 200 && data?.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setState({ isLoading: false, token: newAccessToken, user: data.user });
        return;
      }
      // Network/server error fallback: trust the cached user until we recover.
      const userStr = localStorage.getItem(USER_KEY);
      try {
        const user = userStr ? (JSON.parse(userStr) as User) : null;
        setState({ isLoading: false, token: newAccessToken, user: user ?? null });
      } catch {
        clearAuthStorage();
        setState({ isLoading: false, token: null, user: null });
      }
    };
    void init();

    // Silence unused var warning when accessToken is not used directly.
    void accessToken;
  }, []);

  // Proactive refresh: every 50 minutes, if the user is logged in and the
  // tab is visible, refresh the access token to keep the session alive
  // even while the user is idle.
  useEffect(() => {
    if (!state.user) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void tryRefreshToken();
      }
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.user]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error, status } = await request<{
      accessToken: string;
      refreshToken?: string;
      user: User;
    }>('/api/auth/login', { email, password, deviceId: getDeviceId() });
    if (error || status !== 200 || !data?.accessToken) {
      return { error: (data as { error?: string })?.error ?? error ?? 'Login failed' };
    }
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ isLoading: false, token: data.accessToken, user: data.user });
    return {};
  }, []);

  const logout = useCallback(() => {
    // Best-effort server logout; ignore errors.
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      void fetch(apiUrl('/api/auth/logout'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
    disconnectSocket();
    clearAuthStorage();
    setState({ isLoading: false, token: null, user: null });
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      numberId: string;
      numberIdType: string;
      firstName?: string;
      lastName?: string;
    }) => {
      const {
        data: res,
        error,
        status,
      } = await request<{ accessToken: string; refreshToken?: string; user: User }>(
        '/api/auth/register',
        {
          email: data.email,
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          numberId: data.numberId,
          numberIdType: data.numberIdType,
          password: data.password,
          deviceId: getDeviceId(),
        }
      );
      if (error || (status !== 201 && status !== 200) || !res?.accessToken) {
        return { error: (res as { error?: string })?.error ?? error ?? 'Registration failed' };
      }
      localStorage.setItem(TOKEN_KEY, res.accessToken);
      if (res.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
      }
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setState({ isLoading: false, token: res.accessToken, user: res.user });
      return {};
    },
    []
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await request('/api/auth/recover-password/request', { email });
    if (error) return { error };
    return {};
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    const { error, status } = await request('/api/auth/recover-password/reset', {
      newPassword,
      token,
    });
    if (error || status !== 200) {
      return { error: (error as string) ?? 'Invalid or expired token' };
    }
    return {};
  }, []);

  const updateProfile = useCallback(
    async (data: { address?: string; firstName?: string; lastName?: string; phone?: string }) => {
      const {
        data: res,
        error,
        status,
      } = await request<{ user: User }>('/api/auth/cuenta', data, 'PATCH');
      if (error || status !== 200 || !res?.user) {
        return { error: (res as { error?: string })?.error ?? error ?? 'Update failed' };
      }
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setState((s) => ({ ...s, user: res.user }));
      return {};
    },
    []
  );

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const { error, status } = await request('/api/auth/cambiar-password', {
      currentPassword,
      newPassword,
    });
    if (error || status !== 200) {
      return { error: (error as string) ?? 'Could not change password' };
    }
    return {};
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      changePassword,
      login,
      logout,
      register,
      requestPasswordReset,
      resetPassword,
      updateProfile,
    }),
    [
      state,
      changePassword,
      login,
      logout,
      register,
      requestPasswordReset,
      resetPassword,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
