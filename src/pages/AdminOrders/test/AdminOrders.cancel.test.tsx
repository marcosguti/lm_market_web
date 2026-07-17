import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getKitchenOrders, patchAdminOrderStatus } from '../../../api/orders';

vi.mock('../../../api/orders', () => ({
  assignDelivery: vi.fn(),
  getKitchenOrders: vi.fn(),
  getOrderStatusHistory: vi.fn().mockResolvedValue({ ok: true, data: { history: [] } }),
  markDelivered: vi.fn(),
  patchAdminOrderStatus: vi.fn(),
  startDelivery: vi.fn(),
  unassignDelivery: vi.fn(),
  verifyPayment: vi.fn(),
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

describe('AdminOrders cancel with reason', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('lm_market_token', 'test-token');
    vi.mocked(getKitchenOrders).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: [
          {
            id: 'a5350180-1234-5678-9abc-def012345678',
            status: 'preparing',
            userNumberId: '17322319',
            storeName: 'Altochama',
            totalAmount: 48.53,
            deliveryAddress: null,
            deliveryPhone: null,
            customerNotes: null,
            confirmationCode: null,
            idempotencyKey: null,
            paidAt: null,
            createdAt: '2026-07-13T12:55:02.000Z',
            updatedAt: '2026-07-13T12:55:02.000Z',
            paymentMethod: null,
            paymentReference: null,
            paymentDate: null,
            paymentScreenshotUrl: null,
            deliveryProofUrl: null,
            cancellationReason: null,
            deliveryUserId: null,
            storeId: null,
            payment: null,
            userId: 'u1',
            version: 1,
            products: [],
          },
        ],
        page: 1,
        pageSize: 100,
        total: 1,
        totalPages: 1,
      },
    });
    vi.mocked(patchAdminOrderStatus).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        order: {
          id: 'a5350180-1234-5678-9abc-def012345678',
          status: 'cancelled',
        },
      },
    } as never);
  });

  it('requires reason and sends it when cancelling', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    const openCancel = await screen.findByRole('button', { name: 'Cancelar orden' });
    await user.click(openCancel);

    const reasonInput = await screen.findByPlaceholderText('Motivo de cancelación');
    const confirmButtons = screen.getAllByRole('button', { name: 'Cancelar orden' });
    const confirmBtn = confirmButtons[confirmButtons.length - 1];
    expect(confirmBtn).toBeDisabled();

    await user.type(reasonInput, 'Producto sin disponibilidad');

    await waitFor(() => {
      expect(confirmBtn).not.toBeDisabled();
    });

    await user.click(confirmBtn);

    await waitFor(() => {
      expect(patchAdminOrderStatus).toHaveBeenCalledWith(
        'a5350180-1234-5678-9abc-def012345678',
        'cancelled',
        'Producto sin disponibilidad'
      );
    });
  });
});
