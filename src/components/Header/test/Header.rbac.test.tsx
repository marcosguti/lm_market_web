import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { useAuthMock, flushCartSyncMock, navigateMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  flushCartSyncMock: vi.fn(),
  navigateMock: vi.fn(),
}));

const sampleProduct = {
  code: 'SKU1',
  name: 'Producto',
  price: 10,
  available: 5,
  brand: 'Brand',
  department: 'Dept',
  storeId: 'store-1',
};

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../../context/CartContext', () => ({
  useCart: () => ({
    cart: [{ product: sampleProduct, quantity: 1 }],
    cartSubtotal: 10,
    clearCart: vi.fn(),
    flushCartSync: flushCartSyncMock,
    removeFromCart: vi.fn(),
    totalItemCount: 1,
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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import Header from '../index';

function openUserMenu() {
  fireEvent.click(screen.getAllByText('Mi cuenta')[0]);
}

function openCartDrawer() {
  fireEvent.click(screen.getAllByLabelText('Carrito')[0]);
}

describe('Header RBAC menu and cart', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    flushCartSyncMock.mockReset();
    navigateMock.mockReset();
    vi.mocked(message.info).mockClear();
    flushCartSyncMock.mockResolvedValue({ ok: true, order: { id: 'o1' } });
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
      </MemoryRouter>,
    );
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
    expect(screen.getAllByText('Registro').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Mis compras for client', async () => {
    useAuthMock.mockReturnValue({
      user: { firstName: 'Ana', lastName: 'Client', type: 'client' },
      isLoading: false,
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    openUserMenu();
    await waitFor(() => {
      expect(screen.getAllByText('Mis compras').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows admin menu links for admin', async () => {
    useAuthMock.mockReturnValue({
      user: { firstName: 'Admin', lastName: 'User', type: 'admin' },
      isLoading: false,
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    openUserMenu();
    await waitFor(() => {
      expect(screen.getAllByText('Panel órdenes').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Usuarios').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Productos').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows admin menu links for superAdmin', async () => {
    useAuthMock.mockReturnValue({
      user: { firstName: 'Super', lastName: 'Admin', type: 'superAdmin' },
      isLoading: false,
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    openUserMenu();
    await waitFor(() => {
      expect(screen.getAllByText('Panel órdenes').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Ofertas').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows delivery panel for deliveryDriver', async () => {
    useAuthMock.mockReturnValue({
      user: { firstName: 'Driver', lastName: 'User', type: 'deliveryDriver' },
      isLoading: false,
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    openUserMenu();
    await waitFor(() => {
      expect(screen.getAllByText('Panel reparto').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('guest cart checkout prompts login', async () => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    openCartDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Ir a pagar' }));
    await waitFor(() => {
      expect(vi.mocked(message.info)).toHaveBeenCalledWith('Inicia sesión para continuar al checkout.');
    });
  });

  it('client cart checkout navigates to checkout', async () => {
    useAuthMock.mockReturnValue({
      user: { firstName: 'Ana', lastName: 'Client', type: 'client' },
      isLoading: false,
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    openCartDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Ir a pagar' }));
    await waitFor(() => {
      expect(flushCartSyncMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith('/checkout');
    });
  });

  it('admin cart checkout shows client-only message', async () => {
    useAuthMock.mockReturnValue({
      user: { firstName: 'Admin', lastName: 'User', type: 'admin' },
      isLoading: false,
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    openCartDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Ir a pagar' }));
    await waitFor(() => {
      expect(vi.mocked(message.info)).toHaveBeenCalledWith('Solo usuarios cliente pueden finalizar el pago.');
    });
  });

  it('deliveryDriver cart checkout shows client-only message', async () => {
    useAuthMock.mockReturnValue({
      user: { firstName: 'Driver', lastName: 'User', type: 'deliveryDriver' },
      isLoading: false,
      logout: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    openCartDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Ir a pagar' }));
    await waitFor(() => {
      expect(vi.mocked(message.info)).toHaveBeenCalledWith('Solo usuarios cliente pueden finalizar el pago.');
    });
  });
});
