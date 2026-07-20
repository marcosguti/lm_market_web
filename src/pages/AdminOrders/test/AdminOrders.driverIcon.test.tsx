import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getKitchenOrders } from '../../../api/orders';

vi.mock('../../../api/orders', () => ({
  assignDelivery: vi.fn(),
  getAdminOrderTracking: vi.fn(),
  getKitchenOrders: vi.fn(),
  getOrderDeliveryDrivers: vi.fn().mockResolvedValue({ ok: true, data: { drivers: [] } }),
  getOrderStatusHistory: vi.fn().mockResolvedValue({ ok: true, data: { history: [] } }),
  patchAdminOrderStatus: vi.fn(),
  unassignDelivery: vi.fn(),
  verifyPayment: vi.fn(),
}));

vi.mock('../../../api/adminUsers', () => ({
  getAdminUsers: vi.fn().mockResolvedValue({
    ok: true,
    data: { data: [], page: 1, pageSize: 100, total: 0, totalPages: 1 },
  }),
}));

vi.mock('../../../components/LiveDeliveryMap', () => ({
  LiveDeliveryMap: () => null,
}));

vi.mock('../../../api/stores', () => ({
  getStores: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../realtime/socket', () => ({
  connectSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    isLoading: false,
    user: { id: 'super-1', storeId: null, type: 'superAdmin' },
  }),
}));

import AdminOrdersPage from '../index';

describe('AdminOrders delivery driver icon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('lm_market_token', 'test-token');
    localStorage.removeItem('lm_market_admin_orders_filters');
    vi.mocked(getKitchenOrders).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: [
          {
            id: 'a5350180-1234-5678-9abc-def012345678',
            status: 'delivering',
            userNumberId: '17322319',
            storeName: 'Altochama',
            totalAmount: 10.6,
            deliveryAddress: 'campo claro urbanizacion calle 22, casa 118N al lado de la garita',
            deliveryLatitude: 8.59,
            deliveryLongitude: -71.15,
            deliveryPhone: '04141234567',
            customerNotes: null,
            confirmationCode: null,
            idempotencyKey: null,
            paidAt: null,
            createdAt: '2026-07-15T12:00:00.000Z',
            updatedAt: '2026-07-15T12:00:00.000Z',
            paymentMethod: null,
            paymentReference: null,
            paymentDate: null,
            paymentScreenshotUrl: null,
            deliveryProofUrl: null,
            cancellationReason: null,
            deliveryUserId: 'driver-1',
            deliveryUserName: 'Jose Perez',
            deliveryUserPhone: '04141234567',
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
  });

  it('shows truncated delivery address and phone under it', async () => {
    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const address = screen.getByText(
        'campo claro urbanizacion calle 22, casa 118N al lado de la garita'
      );
      expect(address).toHaveClass('truncate', 'cursor-pointer');
      expect(screen.getByText('04141234567')).toBeInTheDocument();
    });
  });

  it('shows driver icon next to delivering status', async () => {
    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('En Reparto')).toBeInTheDocument();
      const icon = screen.getByLabelText('Repartidor: Jose Perez');
      expect(icon).toBeInTheDocument();
    });
  });

  it('shows live tracking action only when delivering with destination GPS', async () => {
    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Seguimiento en vivo')).toBeInTheDocument();
    });
  });

  it('hides live tracking action when delivering without destination GPS', async () => {
    vi.mocked(getKitchenOrders).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: [
          {
            id: 'a5350180-1234-5678-9abc-def012345678',
            status: 'delivering',
            userNumberId: '17322319',
            storeName: 'Altochama',
            totalAmount: 10.6,
            deliveryAddress: 'campo claro',
            deliveryLatitude: null,
            deliveryLongitude: null,
            deliveryPhone: '04141234567',
            customerNotes: null,
            confirmationCode: null,
            idempotencyKey: null,
            paidAt: null,
            createdAt: '2026-07-15T12:00:00.000Z',
            updatedAt: '2026-07-15T12:00:00.000Z',
            paymentMethod: null,
            paymentReference: null,
            paymentDate: null,
            paymentScreenshotUrl: null,
            deliveryProofUrl: null,
            cancellationReason: null,
            deliveryUserId: 'driver-1',
            deliveryUserName: 'Jose Perez',
            deliveryUserPhone: '04141234567',
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

    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('En Reparto')).toBeInTheDocument();
    });
    expect(screen.queryByLabelText('Seguimiento en vivo')).not.toBeInTheDocument();
  });
});
