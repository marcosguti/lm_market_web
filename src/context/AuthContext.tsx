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

export const DELIVERY_WEB_BLOCKED_MESSAGE =
  'Las cuentas de reparto solo tienen acceso por la aplicación móvil.';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  numberId: string;
  numberIdType?: string;
  type: string;
  address?: string;
  addressCity?: null | string;
  addressLatitude?: null | number;
  addressLongitude?: null | number;
  phone?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
}

/** Delivery drivers use the mobile app only (mirror of mobile admin block). */
export function isBlockedOnWeb(user: null | Pick<User, 'type'> | undefined): boolean {
  return user?.type === 'deliveryDriver';
}

interface LoginResult {
  code?: string;
  codeExpiresInSeconds?: number;
  email?: string;
  error?: string;
}

interface RegisterResult {
  codeExpiresInSeconds?: number;
  codeSent?: boolean;
  email?: string;
  error?: string;
  requiresVerification?: boolean;
}

interface SendCodeResult {
  code?: string;
  codeExpiresInSeconds?: number;
  error?: string;
}

interface AuthState {
  isLoading: boolean;
  token: string | null;
  user: User | null;
}

interface AuthContextValue extends AuthState {
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  register: (data: {
    email: string;
    password: string;
    numberId: string;
    numberIdType: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => Promise<RegisterResult>;
  sendVerificationCode: (email: string) => Promise<SendCodeResult>;
  sendLoginCode: (email: string) => Promise<SendCodeResult>;
  verifyEmail: (email: string, code: string) => Promise<{ code?: string; error?: string }>;
  verifyLoginCode: (email: string, code: string) => Promise<{ code?: string; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ error?: string }>;
  validatePasswordResetToken: (token: string) => Promise<{ error?: string }>;
  setUser: (user: User) => void;
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
    error: data.error ?? (res.ok ? undefined : 'Error en la solicitud'),
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
    error: data.error ?? (res.ok ? undefined : 'Error en la solicitud'),
    status: res.status,
  };
}

function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function rejectBlockedWebSession(): { error: string } {
  disconnectSocket();
  clearAuthStorage();
  return { error: DELIVERY_WEB_BLOCKED_MESSAGE };
}

type AuthBootstrapResult = {
  isLoading: false;
  token: string | null;
  user: User | null;
};

/** Shared across StrictMode remounts so /me runs once per page load. */
let authInitPromise: Promise<AuthBootstrapResult> | null = null;

async function bootstrapAuth(): Promise<AuthBootstrapResult> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (refreshToken) {
    await tryRefreshToken();
  }
  const newAccessToken = localStorage.getItem(TOKEN_KEY);
  if (!newAccessToken) {
    return { isLoading: false, token: null, user: null };
  }
  const { data, status } = await getRequest<{ user: User }>('/api/auth/me');
  if (status === 401) {
    clearAuthStorage();
    return { isLoading: false, token: null, user: null };
  }
  if (status === 200 && data?.user) {
    if (isBlockedOnWeb(data.user)) {
      rejectBlockedWebSession();
      return { isLoading: false, token: null, user: null };
    }
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return { isLoading: false, token: newAccessToken, user: data.user };
  }
  const userStr = localStorage.getItem(USER_KEY);
  try {
    const user = userStr ? (JSON.parse(userStr) as User) : null;
    if (isBlockedOnWeb(user)) {
      rejectBlockedWebSession();
      return { isLoading: false, token: null, user: null };
    }
    return { isLoading: false, token: newAccessToken, user: user ?? null };
  } catch {
    clearAuthStorage();
    return { isLoading: false, token: null, user: null };
  }
}

function getAuthBootstrap(): Promise<AuthBootstrapResult> {
  if (!authInitPromise) {
    authInitPromise = bootstrapAuth();
  }
  return authInitPromise;
}

/** @internal Test-only reset for auth bootstrap singleton. */
export function resetAuthBootstrapForTests(): void {
  authInitPromise = null;
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
    let cancelled = false;
    void getAuthBootstrap().then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
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

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const res = await fetch(apiUrl('/api/auth/login'), {
      body: JSON.stringify({ email, password, deviceId: getDeviceId() }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
      return {
        code: data.code,
        codeExpiresInSeconds: data.codeExpiresInSeconds as number | undefined,
        email: data.email ?? email,
      };
    }
    if (!res.ok || !data.accessToken) {
      return { error: data.error ?? 'Error al iniciar sesión' };
    }
    if (isBlockedOnWeb(data.user as User | undefined)) {
      return rejectBlockedWebSession();
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
      phone?: string;
    }): Promise<RegisterResult> => {
      const {
        data: res,
        error,
        status,
      } = await request<{
        codeExpiresInSeconds?: number;
        codeSent?: boolean;
        email: string;
        message: string;
        requiresVerification: boolean;
      }>('/api/auth/register', {
        email: data.email,
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        numberId: data.numberId,
        numberIdType: data.numberIdType,
        password: data.password,
        phone: data.phone ?? '',
        deviceId: getDeviceId(),
      });
      if (error || status !== 201 || !res?.requiresVerification) {
        return { error: (res as { error?: string })?.error ?? error ?? 'Error al registrarse' };
      }
      return {
        codeExpiresInSeconds: res.codeExpiresInSeconds,
        codeSent: res.codeSent,
        email: res.email,
        requiresVerification: true,
      };
    },
    []
  );

  const sendVerificationCode = useCallback(async (email: string): Promise<SendCodeResult> => {
    const res = await fetch(apiUrl('/api/auth/verify-email/send'), {
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 429 && data.code === 'CODE_STILL_VALID') {
      return {
        code: data.code,
        codeExpiresInSeconds: data.codeExpiresInSeconds as number,
        error: data.error as string,
      };
    }

    if (!res.ok) {
      return { error: (data.error as string) ?? 'No se pudo enviar el código' };
    }

    return { codeExpiresInSeconds: data.codeExpiresInSeconds as number | undefined };
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const { data, error, status } = await request<{
      accessToken: string;
      refreshToken?: string;
      user: User;
    }>('/api/auth/verify-email', {
      code,
      deviceId: getDeviceId(),
      email,
    });
    if (error || status !== 200 || !data?.accessToken) {
      const errData = data as { code?: string; error?: string };
      return {
        code: errData?.code,
        error: errData?.error ?? error ?? 'Código inválido',
      };
    }
    if (isBlockedOnWeb(data.user)) {
      setState({ isLoading: false, token: null, user: null });
      return rejectBlockedWebSession();
    }
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ isLoading: false, token: data.accessToken, user: data.user });
    return {};
  }, []);

  const sendLoginCode = useCallback(async (email: string): Promise<SendCodeResult> => {
    const res = await fetch(apiUrl('/api/auth/login-code/send'), {
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 429 && data.code === 'CODE_STILL_VALID') {
      return {
        code: data.code,
        codeExpiresInSeconds: data.codeExpiresInSeconds as number,
        error: data.error as string,
      };
    }

    if (!res.ok) {
      return {
        code: data.code as string | undefined,
        error: (data.error as string) ?? 'No se pudo enviar el código',
      };
    }

    return { codeExpiresInSeconds: data.codeExpiresInSeconds as number | undefined };
  }, []);

  const verifyLoginCode = useCallback(async (email: string, code: string) => {
    const { data, error, status } = await request<{
      accessToken: string;
      refreshToken?: string;
      user: User;
    }>('/api/auth/login-code/verify', {
      code,
      deviceId: getDeviceId(),
      email,
    });
    if (error || status !== 200 || !data?.accessToken) {
      const errData = data as { code?: string; error?: string };
      return {
        code: errData?.code,
        error: errData?.error ?? error ?? 'Código inválido',
      };
    }
    if (isBlockedOnWeb(data.user)) {
      setState({ isLoading: false, token: null, user: null });
      return rejectBlockedWebSession();
    }
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ isLoading: false, token: data.accessToken, user: data.user });
    return {};
  }, []);

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
      return { error: (error as string) ?? 'Token inválido o expirado' };
    }
    return {};
  }, []);

  const validatePasswordResetToken = useCallback(async (token: string) => {
    const { error, status } = await getRequest(
      `/api/auth/recover-password/validate?token=${encodeURIComponent(token)}`
    );
    if (error || status !== 200) {
      return { error: (error as string) ?? 'Token inválido o expirado' };
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
        return { error: (res as { error?: string })?.error ?? error ?? 'Error al actualizar' };
      }
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setState((s) => ({ ...s, user: res.user }));
      return {};
    },
    []
  );

  const setUser = useCallback((next: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    setState((s) => ({ ...s, user: next }));
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const { error, status } = await request('/api/auth/cambiar-password', {
      currentPassword,
      newPassword,
    });
    if (error || status !== 200) {
      return { error: (error as string) ?? 'No se pudo cambiar la contraseña' };
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
      sendVerificationCode,
      sendLoginCode,
      setUser,
      updateProfile,
      validatePasswordResetToken,
      verifyEmail,
      verifyLoginCode,
    }),
    [
      state,
      changePassword,
      login,
      logout,
      register,
      requestPasswordReset,
      resetPassword,
      sendVerificationCode,
      sendLoginCode,
      setUser,
      updateProfile,
      validatePasswordResetToken,
      verifyEmail,
      verifyLoginCode,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
