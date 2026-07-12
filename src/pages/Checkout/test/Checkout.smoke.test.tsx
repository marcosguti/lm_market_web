import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../../context/CartContext', () => ({
  useCart: () => ({
    cart: [{ product: { code: 'SKU1', name: 'P', price: 1, available: 1 }, quantity: 1 }],
    cartSubtotal: 1,
    clearCart: vi.fn(),
    flushCartSync: vi.fn().mockResolvedValue({ ok: true, order: { id: 'o1' } }),
    removeFromCart: vi.fn(),
    replaceFromOrderLines: vi.fn(),
    totalItemCount: 1,
    updateQuantity: vi.fn(),
  }),
}));

vi.mock('../../../api/payments', () => ({
  getPaymentBanks: vi.fn().mockResolvedValue({ ok: true, data: { banks: [] } }),
  getPaymentConfig: vi.fn().mockResolvedValue({
    ok: true,
    data: { megasoftP2cEnabled: false, usdRate: 40 },
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
      },
      changes: [],
    },
  }),
}));

import CheckoutPage from '../index';

describe('Checkout page smoke', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: { type: 'client', firstName: 'Ana', lastName: 'Client', email: 'a@test.com' },
      isLoading: false,
    });
  });

  it('renders checkout title for client', async () => {
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Finalizar pedido')).toBeInTheDocument();
    });
  });

  it('shows cash payment option', async () => {
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(/efectivo/i)).toBeInTheDocument();
    });
  });
});
