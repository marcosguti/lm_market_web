import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ensureCart, patchOrderLines } from '../../api/orders';
import { getStores } from '../../api/stores';
import { CartProvider, useCart } from '../CartContext';

vi.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', type: 'client' },
    isLoading: false,
  }),
}));

vi.mock('../../api/orders', () => ({
  ensureCart: vi.fn(),
  patchOrderLines: vi.fn(),
}));

vi.mock('../../api/stores', () => ({
  getStores: vi.fn(),
}));

vi.mock('antd', () => ({
  message: { error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

function CartProbe() {
  const { addToCart, cart, flushCartSync, orderId, totalItemCount } = useCart();
  return (
    <div>
      <span data-testid="order-id">{orderId ?? ''}</span>
      <span data-testid="count">{totalItemCount}</span>
      <span data-testid="first-image">{cart[0]?.product.imageUrl ?? ''}</span>
      <button
        type="button"
        onClick={() =>
          addToCart(
            {
              id: 'db-product-id',
              code: 'SKU1',
              imageUrl: 'https://cdn.example.com/sku1.jpg',
              name: 'Product',
              price: 10,
              stockQuantity: 20,
            },
            2
          )
        }
      >
        add
      </button>
      <button type="button" onClick={() => void flushCartSync()}>
        flush
      </button>
      <span data-testid="cart-size">{cart.length}</span>
    </div>
  );
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('lm_market_store', 'store-1');
    vi.clearAllMocks();

    vi.mocked(getStores).mockResolvedValue([{ id: 'store-1', name: 'Main' }]);
    vi.mocked(ensureCart).mockResolvedValue({
      ok: true,
      data: {
        changes: [],
        order: {
          id: 'order-1',
          products: [],
          confirmationCode: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          customerNotes: null,
          deliveryAddress: null,
          deliveryPhone: null,
          deliveryUserId: null,
          idempotencyKey: null,
          paidAt: null,
          payment: null,
          paymentDate: null,
          paymentMethod: null,
          paymentReference: null,
          paymentScreenshotUrl: null,
          status: 'pending',
          storeId: 'store-1',
          totalAmount: 0,
          updatedAt: '2026-01-01T00:00:00.000Z',
          userId: 'u1',
          userNumberId: '1',
          version: 1,
        },
      },
    });

    vi.mocked(patchOrderLines).mockImplementation(async (_orderId, lines) => ({
      ok: true,
      data: {
        changes: [],
        order: {
          id: 'order-1',
          products: lines.map((line) => ({
            code: line.code,
            description: null,
            imageUrl: 'https://cdn.example.com/sku1.jpg',
            lineTotal: line.quantity * 10,
            name: 'Product',
            quantity: line.quantity,
            unitPrice: 10,
          })),
          confirmationCode: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          customerNotes: null,
          deliveryAddress: null,
          deliveryPhone: null,
          deliveryUserId: null,
          idempotencyKey: null,
          paidAt: null,
          payment: null,
          paymentDate: null,
          paymentMethod: null,
          paymentReference: null,
          paymentScreenshotUrl: null,
          status: 'pending',
          storeId: 'store-1',
          totalAmount: lineTotal(lines),
          updatedAt: '2026-01-01T00:00:00.000Z',
          userId: 'u1',
          userNumberId: '1',
          version: 2,
        },
      },
    }));
  });

  it('addToCart respects stock cap', async () => {
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>
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

  it('does not loop patchOrderLines when server returns equivalent lines', async () => {
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('order-id')).toHaveTextContent('order-1');
    });

    await userEvent.click(screen.getByRole('button', { name: 'add' }));

    await waitFor(
      () => {
        expect(patchOrderLines).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 }
    );

    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(patchOrderLines).toHaveBeenCalledTimes(1);
    expect(patchOrderLines).toHaveBeenCalledWith(
      'order-1',
      [{ code: 'SKU1', quantity: 2 }],
      'store-1'
    );
  });

  it('auto syncs after addToCart', async () => {
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('order-id')).toHaveTextContent('order-1');
    });

    await userEvent.click(screen.getByRole('button', { name: 'add' }));

    await waitFor(
      () => {
        expect(patchOrderLines).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 }
    );
  });

  it('debounces rapid addToCart clicks into a single patchOrderLines call', async () => {
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('order-id')).toHaveTextContent('order-1');
    });

    const addButton = screen.getByRole('button', { name: 'add' });
    await userEvent.click(addButton);
    await userEvent.click(addButton);
    await userEvent.click(addButton);
    await userEvent.click(addButton);
    await userEvent.click(addButton);

    await waitFor(
      () => {
        expect(screen.getByTestId('count')).toHaveTextContent('10');
      },
      { timeout: 1000 }
    );

    await waitFor(
      () => {
        expect(patchOrderLines).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 }
    );

    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(patchOrderLines).toHaveBeenCalledTimes(1);
    expect(patchOrderLines).toHaveBeenCalledWith(
      'order-1',
      [{ code: 'SKU1', quantity: 10 }],
      'store-1'
    );
  });

  it('keeps product imageUrl after server sync', async () => {
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('order-id')).toHaveTextContent('order-1');
    });

    await userEvent.click(screen.getByRole('button', { name: 'add' }));

    await waitFor(
      () => {
        expect(screen.getByTestId('first-image')).toHaveTextContent(
          'https://cdn.example.com/sku1.jpg'
        );
      },
      { timeout: 2000 }
    );
  });

  it('flushCartSync syncs immediately without waiting for debounce', async () => {
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('order-id')).toHaveTextContent('order-1');
    });

    await userEvent.click(screen.getByRole('button', { name: 'add' }));
    await userEvent.click(screen.getByRole('button', { name: 'flush' }));

    await waitFor(() => {
      expect(patchOrderLines).toHaveBeenCalledTimes(1);
    });

    expect(patchOrderLines).toHaveBeenCalledWith(
      'order-1',
      [{ code: 'SKU1', quantity: 2 }],
      'store-1'
    );
  });
});

function lineTotal(lines: { quantity: number }[]): number {
  return lines.reduce((sum, line) => sum + line.quantity * 10, 0);
}
