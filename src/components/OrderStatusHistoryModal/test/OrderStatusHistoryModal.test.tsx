import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getOrderStatusHistory } from '../../../api/orders';
import { OrderStatusHistoryModal } from '../index';

vi.mock('../../../api/orders', () => ({
  getOrderStatusHistory: vi.fn(),
}));

describe('OrderStatusHistoryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when history is empty', async () => {
    vi.mocked(getOrderStatusHistory).mockResolvedValue({
      ok: true,
      status: 200,
      data: { history: [] },
    });

    render(
      <OrderStatusHistoryModal
        open
        orderId="b582331c-1234-5678-9abc-def012345678"
        onClose={() => undefined}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('#b582331c Historial de estados')).toBeInTheDocument();
      expect(screen.getByText('Sin cambios de estado registrados')).toBeInTheDocument();
    });
  });

  it('shows delivery proof image for delivered entry', async () => {
    vi.mocked(getOrderStatusHistory).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        history: [
          {
            id: 'h2',
            fromStatus: 'delivering',
            toStatus: 'delivered',
            createdAt: '2026-07-15T12:00:00.000Z',
            deliveryProofUrl: 'https://cdn.example/proof.jpg',
            changedBy: {
              id: 'd1',
              firstName: 'Jose',
              lastName: 'Perez',
              email: 'jose@test.com',
              type: 'deliveryDriver',
            },
          },
        ],
      },
    });

    render(<OrderStatusHistoryModal open orderId="order-1" onClose={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByText(/En Reparto → Entregada/)).toBeInTheDocument();
      expect(screen.getByAltText('Foto de entrega')).toHaveAttribute(
        'src',
        'https://cdn.example/proof.jpg'
      );
    });
  });

  it('shows cancellation reason for cancelled entry', async () => {
    vi.mocked(getOrderStatusHistory).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        history: [
          {
            id: 'h3',
            fromStatus: 'preparing',
            toStatus: 'cancelled',
            createdAt: '2026-07-15T12:00:00.000Z',
            cancellationReason: 'Cliente no responde',
            changedBy: {
              id: 'a1',
              firstName: 'Ana',
              lastName: 'Admin',
              email: 'ana@test.com',
              type: 'admin',
            },
          },
        ],
      },
    });

    render(<OrderStatusHistoryModal open orderId="order-1" onClose={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByText(/Preparando → Cancelada/)).toBeInTheDocument();
      expect(screen.getByText('Motivo de cancelación')).toBeInTheDocument();
      expect(screen.getByText('Cliente no responde')).toBeInTheDocument();
    });
  });
});
