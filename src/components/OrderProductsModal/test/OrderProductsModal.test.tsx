import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { OrderEntity } from '../../../types/order';

import { OrderProductsModal } from '../index';

const baseOrder: OrderEntity = {
  confirmationCode: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  customerNotes: null,
  deliveryAddress: null,
  deliveryPhone: null,
  deliveryUserId: null,
  id: 'order-1',
  idempotencyKey: null,
  paidAt: null,
  payment: null,
  paymentDate: null,
  paymentMethod: null,
  paymentReference: null,
  paymentScreenshotUrl: null,
  products: [
    {
      code: '001',
      description: null,
      imageUrl: 'https://example.com/product.jpg',
      lineTotal: 10,
      name: 'Producto A',
      quantity: 2,
      unitPrice: 5,
    },
    {
      code: '002',
      description: null,
      lineTotal: 5,
      name: 'Producto B',
      quantity: 1,
      unitPrice: 5,
    },
  ],
  status: 'paymentConfirmed',
  storeId: 'store-1',
  storeName: 'Sede Centro',
  totalAmount: 15,
  updatedAt: '2026-01-01T00:00:00.000Z',
  userId: 'user-1',
  userNumberId: '123',
  version: 1,
};

describe('OrderProductsModal', () => {
  it('renders store name, product image and Bs prices', () => {
    render(<OrderProductsModal open onClose={() => undefined} order={baseOrder} />);

    expect(screen.getByText('Sede: Sede Centro')).toBeInTheDocument();
    expect(screen.getByText('Producto A')).toBeInTheDocument();
    expect(screen.getByText('Producto B')).toBeInTheDocument();
    expect(document.querySelector('img[src="https://example.com/product.jpg"]')).not.toBeNull();
    expect(screen.getByText('Bs 6.000,00')).toBeInTheDocument();
    expect(screen.getByText('Bs 9.000,00')).toBeInTheDocument();
  });

  it('shows placeholder when product has no image', () => {
    render(
      <OrderProductsModal
        open
        onClose={() => undefined}
        order={{
          ...baseOrder,
          products: [{ ...baseOrder.products[1], imageUrl: null }],
        }}
      />
    );

    expect(screen.getAllByText('LM').length).toBeGreaterThanOrEqual(1);
  });

  it('shows dash when store name is missing', () => {
    render(
      <OrderProductsModal
        open
        onClose={() => undefined}
        order={{ ...baseOrder, storeName: null }}
      />
    );

    expect(screen.getByText('Sede: —')).toBeInTheDocument();
  });
});
