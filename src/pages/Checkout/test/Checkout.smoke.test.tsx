import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../../api/payments', () => ({
  getPaymentBanks: vi.fn().mockResolvedValue({ ok: true, data: { banks: [] } }),
  getPaymentConfig: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      megasoftEnabled: false,
      methods: [
        {
          information: null,
          method: 'cash',
          noteEnabled: true,
          placeholder: 'Toma una foto legible del billete',
        },
        {
          information: null,
          method: 'zelle',
          noteEnabled: true,
          placeholder: null,
        },
      ],
      usdRate: 40,
    },
  }),
  verifyMobilePayment: vi.fn(),
}));

vi.mock('../../../api/orders', () => ({
  confirmOrderPayment: vi.fn(),
  ensureCart: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      order: {
        id: 'o1',
        status: 'pending',
        products: [],
        totalAmount: 10,
        userId: 'u1',
        storeId: 's1',
      },
      changes: [],
    },
  }),
}));

vi.mock('../../../api/stores', () => ({
  getStores: vi.fn().mockResolvedValue([
    {
      id: 's1',
      name: 'Las Americas',
      externalBranchCode: '1',
      city: 'merida',
      latitude: 8.598136,
      longitude: -71.150426,
    },
  ]),
}));

vi.mock('../../../context/CartContext', () => ({
  useCart: () => ({
    cart: [{ product: { code: 'SKU1', name: 'P', price: 1, available: 1 }, quantity: 1 }],
    cartSubtotal: 1,
    clearCart: vi.fn(),
    flushCartSync: vi.fn().mockResolvedValue({
      ok: true,
      order: {
        id: 'o1',
        status: 'pending',
        products: [{ code: 'SKU1', name: 'P', quantity: 1, lineTotal: 1, unitPrice: 1 }],
        totalAmount: 10,
        userId: 'u1',
        storeId: 's1',
      },
      changes: [],
    }),
    removeFromCart: vi.fn(),
    replaceFromOrderLines: vi.fn(),
    totalItemCount: 1,
    updateQuantity: vi.fn(),
  }),
}));

import CheckoutPage from '../index';

describe('Checkout page smoke', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: { type: 'client', firstName: 'Ana', lastName: 'Client', email: 'a@test.com' },
      isLoading: false,
      setUser: vi.fn(),
    });
  });

  it('renders checkout title for client', async () => {
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Finalizar pedido')).toBeInTheDocument();
    });
  });

  it('shows cash payment option', async () => {
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/efectivo/i)).toBeInTheDocument();
    });
  });

  it('requires payment screenshot for cash checkout', async () => {
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Comprobante de pago')).toBeInTheDocument();
      expect(screen.getByText(/Toma una foto legible del billete/i)).toBeInTheDocument();
    });
  });

  it('prompts to configure map address when missing', async () => {
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Dirección de entrega')).toBeInTheDocument();
      expect(screen.getByText(/Elige una nueva dirección/i)).toBeInTheDocument();
    });
  });
});
