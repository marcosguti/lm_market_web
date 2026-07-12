import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from '../AuthContext';

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

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('login stores token and user on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          token: 'access',
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
});
