import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getKitchenOrders, verifyPayment } from '../../../api/orders';

vi.mock('../../../api/orders', () => ({
  assignDelivery: vi.fn(),
  getAdminOrderTracking: vi.fn(),
  getKitchenOrders: vi.fn(),
  getOrderStatusHistory: vi.fn().mockResolvedValue({ ok: true, data: { history: [] } }),
  patchAdminOrderStatus: vi.fn(),
  unassignDelivery: vi.fn(),
  verifyPayment: vi.fn(),
}));

vi.mock('../../../components/LiveDeliveryMap', () => ({
  LiveDeliveryMap: () => null,
}));

vi.mock('../../../api/adminUsers', () => ({
  getAdminUsers: vi.fn().mockResolvedValue({
    ok: true,
    data: { data: [], page: 1, pageSize: 100, total: 0, totalPages: 1 },
  }),
}));

vi.mock('../../../api/stores', () => ({
  getStores: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../realtime/socket', () => ({
  connectSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
}));

import AdminOrdersPage from '../index';

const pendingConfirmationOrder = {
  id: 'a5350180-1234-5678-9abc-def012345678',
  status: 'paymentPendingConfirmation' as const,
  userNumberId: '17322319',
  storeName: 'Altochama',
  totalAmount: 48.53,
  deliveryAddress: 'Calle 1',
  deliveryPhone: '04141234567',
  customerNotes: null,
  confirmationCode: null,
  idempotencyKey: null,
  paidAt: '2026-07-13T12:55:02.000Z',
  createdAt: '2026-07-13T12:55:02.000Z',
  updatedAt: '2026-07-13T12:55:02.000Z',
  paymentMethod: 'cash' as const,
  paymentReference: null,
  paymentDate: '2026-07-13T12:55:02.000Z',
  paymentScreenshotUrl: 'https://cdn.example/proof.jpg',
  deliveryProofUrl: null,
  cancellationReason: null,
  deliveryUserId: null,
  storeId: null,
  payment: null,
  userId: 'u1',
  version: 1,
  products: [],
};

describe('AdminOrders verify payment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('lm_market_token', 'test-token');
    vi.mocked(getKitchenOrders).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: [pendingConfirmationOrder],
        page: 1,
        pageSize: 100,
        total: 1,
        totalPages: 1,
      },
    });
    vi.mocked(verifyPayment).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        order: { ...pendingConfirmationOrder, status: 'paymentConfirmed' },
      },
    } as never);
  });

  it('shows Pago por confirmar and verify action for screenshot orders', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pago por confirmar')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /detalles del pago/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verificar pago/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /verificar pago/i }));

    await waitFor(() => {
      expect(verifyPayment).toHaveBeenCalledWith(pendingConfirmationOrder.id, true);
    });
  });
});
