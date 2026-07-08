import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Header from '../index';

const useAuthMock = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../../context/CartContext', () => ({
  useCart: () => ({
    cart: [],
    cartSubtotal: 0,
    clearCart: vi.fn(),
    flushCartSync: vi.fn(),
    removeFromCart: vi.fn(),
    totalItemCount: 0,
    updateQuantity: vi.fn(),
  }),
}));

vi.mock('../../../api/notifications', () => ({
  getNotifications: vi.fn().mockResolvedValue({ ok: true, data: { data: [] } }),
  markNotificationRead: vi.fn(),
}));

vi.mock('../../../realtime/socket', () => ({
  connectSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
}));

describe('Header RBAC menu', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows account entry for authenticated client', () => {
    useAuthMock.mockReturnValue({
      user: { firstName: 'Ana', lastName: 'Client', type: 'client' },
      isLoading: false,
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getAllByText('Mi cuenta').length).toBeGreaterThanOrEqual(1);
  });

  it('shows account entry for authenticated admin', () => {
    useAuthMock.mockReturnValue({
      user: { firstName: 'Admin', lastName: 'User', type: 'admin' },
      isLoading: false,
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getAllByText('Mi cuenta').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Iniciar sesión')).not.toBeInTheDocument();
    expect(screen.queryByText('Registro')).not.toBeInTheDocument();
  });

  it('shows login and register actions for guests', () => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
    expect(screen.getAllByText('Registro').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryAllByText('Mi cuenta')).toHaveLength(0);
  });
});
