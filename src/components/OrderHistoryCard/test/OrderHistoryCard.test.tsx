import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { OrderEntity, OrderLine } from '../../../types/order';

import { formatDateTime } from '../../../utils/formatDate';
import { OrderHistoryCard } from '../index';

function line(partial: Partial<OrderLine> & Pick<OrderLine, 'code' | 'name'>): OrderLine {
  return {
    description: null,
    imageUrl: null,
    lineTotal: 10,
    quantity: 1,
    unitPrice: 5,
    ...partial,
  };
}

const baseOrder: OrderEntity = {
  id: '0dc2e9bc-1234-5678-9abc-def012345678',
  status: 'readyForDelivery',
  storeName: 'Las Americas',
  totalAmount: 12,
  createdAt: '2026-07-18T23:10:00.000Z',
  confirmationCode: null,
  customerNotes: null,
  deliveryAddress: 'Calle 1',
  deliveryPhone: null,
  deliveryProofUrl: null,
  cancellationReason: null,
  deliveryUserId: null,
  idempotencyKey: null,
  paidAt: null,
  payment: null,
  paymentDate: null,
  paymentMethod: null,
  paymentReference: null,
  paymentScreenshotUrl: null,
  products: [line({ code: '001', name: 'Arroz', quantity: 2 })],
  storeId: null,
  updatedAt: '2026-07-18T23:10:00.000Z',
  userId: 'u1',
  userNumberId: '123',
  version: 1,
};

describe('OrderHistoryCard', () => {
  it('renders sede, status and Ver detalle CTA', async () => {
    const onViewDetail = vi.fn();
    const user = userEvent.setup();

    render(<OrderHistoryCard order={baseOrder} usdRate={36} onViewDetail={onViewDetail} />);

    expect(screen.getByText('Sede')).toBeInTheDocument();
    expect(screen.getByText('Las Americas')).toBeInTheDocument();
    expect(screen.getByText('Lista para Reparto')).toBeInTheDocument();
    expect(screen.getByText('Pedido realizado')).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(baseOrder.createdAt))).toBeInTheDocument();
    expect(screen.queryByText(/Pago:/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));
    expect(onViewDetail).toHaveBeenCalledWith(baseOrder);
  });

  it('shows paymentDate as Pedido realizado and hides Pago line', () => {
    const order: OrderEntity = {
      ...baseOrder,
      createdAt: '2026-07-19T23:15:00.000Z',
      paymentDate: '2026-07-20T16:05:00.000Z',
    };

    render(<OrderHistoryCard order={order} usdRate={36} onViewDetail={vi.fn()} />);

    expect(screen.getByText(formatDateTime(order.paymentDate))).toBeInTheDocument();
    expect(screen.queryByText(formatDateTime(order.createdAt))).not.toBeInTheDocument();
    expect(screen.queryByText(/Pago:/)).not.toBeInTheDocument();
  });
});
