import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CartProvider, useCart } from '../CartContext';

vi.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', type: 'client' },
    isLoading: false,
  }),
}));

vi.mock('../../api/orders', () => ({
  ensureCart: vi.fn().mockResolvedValue({ ok: true, data: { order: null, changes: [] } }),
  patchOrderLines: vi.fn(),
}));

vi.mock('../../api/stores', () => ({
  getStores: vi.fn().mockResolvedValue([]),
}));

vi.mock('antd', () => ({
  message: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

function CartProbe() {
  const { addToCart, cart, totalItemCount } = useCart();
  return (
    <div>
      <span data-testid="count">{totalItemCount}</span>
      <button
        type="button"
        onClick={() =>
          addToCart({ id: 'p1', name: 'Product', price: 10, totalStock: 3 }, 2)
        }
      >
        add
      </button>
      <span data-testid="cart-size">{cart.length}</span>
    </div>
  );
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('addToCart respects stock cap', async () => {
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('0');
    });

    await userEvent.click(screen.getByRole('button', { name: 'add' }));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2');
      expect(screen.getByTestId('cart-size')).toHaveTextContent('1');
    });
  });
});
