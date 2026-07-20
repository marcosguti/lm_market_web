import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuthProvider,
  DELIVERY_WEB_BLOCKED_MESSAGE,
  normalizeAuthUser,
  resetAuthBootstrapForTests,
  useAuth,
} from '../AuthContext';

vi.mock('../../realtime/socket', () => ({
  disconnectSocket: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  apiUrl: (path: string) => `http://localhost${path}`,
  getDeviceId: () => 'device-test',
  tryRefreshToken: vi.fn().mockResolvedValue(false),
}));

function AuthProbe() {
  const { login, logout, user, isLoading } = useAuth();
  if (isLoading) return <div>loading</div>;
  return (
    <div>
      <span data-testid="user">{user?.email ?? 'guest'}</span>
      <button type="button" onClick={() => void login('a@test.com', 'secret')}>
        login
      </button>
      <button type="button" onClick={() => logout()}>
        logout
      </button>
    </div>
  );
}

function LoginResultProbe() {
  const { login, user, isLoading } = useAuth();
  const [error, setError] = useState('');
  if (isLoading) return <div>loading</div>;
  return (
    <div>
      <span data-testid="user">{user?.email ?? 'guest'}</span>
      <span data-testid="error">{error || 'none'}</span>
      <button
        type="button"
        onClick={() => {
          void login('driver@test.com', 'secret').then((result) => {
            setError(result.error ?? '');
          });
        }}
      >
        login
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    resetAuthBootstrapForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('bootstrap calls /me only once under StrictMode', async () => {
    localStorage.setItem('lm_market_token', 'access');

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes('/api/auth/me')) {
        return Promise.resolve({
          json: async () => ({
            user: {
              id: 'u1',
              email: 'a@test.com',
              firstName: 'Ana',
              lastName: 'Test',
              numberId: '1',
              type: 'client',
            },
          }),
          ok: true,
          status: 200,
        });
      }
      return Promise.resolve({
        json: async () => ({}),
        ok: true,
        status: 200,
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <StrictMode>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('a@test.com');
    });

    const meCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes('/api/auth/me'),
    );
    expect(meCalls).toHaveLength(1);
  });

  it('login stores token and user on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          accessToken: 'access',
          refreshToken: 'refresh',
          user: {
            id: 'u1',
            email: 'a@test.com',
            firstName: 'Ana',
            lastName: 'Test',
            numberId: '1',
            type: 'client',
          },
        }),
        ok: true,
      }),
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('guest');
    });

    await userEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('a@test.com');
    });
    expect(localStorage.getItem('lm_market_token')).toBe('access');
  });

  it('login rejects deliveryDriver and clears session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          accessToken: 'access',
          refreshToken: 'refresh',
          user: {
            id: 'd1',
            email: 'driver@test.com',
            firstName: 'Driver',
            lastName: 'User',
            numberId: '2',
            type: 'deliveryDriver',
          },
        }),
        ok: true,
      }),
    );

    render(
      <AuthProvider>
        <LoginResultProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('guest');
    });

    await userEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(DELIVERY_WEB_BLOCKED_MESSAGE);
    });
    expect(screen.getByTestId('user')).toHaveTextContent('guest');
    expect(localStorage.getItem('lm_market_token')).toBeNull();
    expect(localStorage.getItem('lm_market_user')).toBeNull();
  });

  it('bootstrap rejects deliveryDriver session from /me', async () => {
    localStorage.setItem('lm_market_token', 'access');
    localStorage.setItem(
      'lm_market_user',
      JSON.stringify({
        id: 'd1',
        email: 'driver@test.com',
        firstName: 'Driver',
        lastName: 'User',
        numberId: '2',
        type: 'deliveryDriver',
      }),
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (String(url).includes('/api/auth/me')) {
          return Promise.resolve({
            json: async () => ({
              user: {
                id: 'd1',
                email: 'driver@test.com',
                firstName: 'Driver',
                lastName: 'User',
                numberId: '2',
                type: 'deliveryDriver',
              },
            }),
            ok: true,
            status: 200,
          });
        }
        return Promise.resolve({
          json: async () => ({}),
          ok: true,
          status: 200,
        });
      }),
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('guest');
    });
    expect(localStorage.getItem('lm_market_token')).toBeNull();
    expect(localStorage.getItem('lm_market_user')).toBeNull();
  });

  it('logout clears session storage', async () => {
    localStorage.setItem('lm_market_token', 'access');
    localStorage.setItem(
      'lm_market_user',
      JSON.stringify({
        id: 'u1',
        email: 'a@test.com',
        firstName: 'Ana',
        lastName: 'Test',
        numberId: '1',
        type: 'client',
      }),
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          user: {
            id: 'u1',
            email: 'a@test.com',
            firstName: 'Ana',
            lastName: 'Test',
            numberId: '1',
            type: 'client',
          },
        }),
        ok: true,
        status: 200,
      }),
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('a@test.com');
    });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'logout' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('guest');
    });
    expect(localStorage.getItem('lm_market_token')).toBeNull();
  });

  it('normalizeAuthUser coerces Decimal string coords to numbers', () => {
    const user = normalizeAuthUser({
      id: 'u1',
      email: 'a@test.com',
      firstName: 'Ana',
      lastName: 'Test',
      numberId: '1',
      type: 'client',
      addressLatitude: '8.5981360' as unknown as number,
      addressLongitude: '-71.1504260' as unknown as number,
    });
    expect(typeof user.addressLatitude).toBe('number');
    expect(typeof user.addressLongitude).toBe('number');
    expect(user.addressLatitude).toBeCloseTo(8.598136);
    expect(user.addressLongitude).toBeCloseTo(-71.150426);
  });
});
