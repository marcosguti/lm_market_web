import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getOrderHistory } from '../../../api/orders';

vi.mock('../../../api/orders', () => ({
  getOrderHistory: vi.fn(),
}));

vi.mock('../../../realtime/socket', () => ({
  connectSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
}));

import MyOrdersPage from '../index';

describe('MyOrders page smoke', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.mocked(getOrderHistory).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: [
          {
            id: 'order-delivering',
            status: 'delivering',
            storeName: 'Centro',
            totalAmount: 12,
            createdAt: '2026-07-17T12:00:00.000Z',
            confirmationCode: null,
            customerNotes: null,
            deliveryAddress: 'Calle 1',
            deliveryPhone: null,
            deliveryProofUrl: null,
            cancellationReason: null,
            deliveryUserId: 'driver-1',
            idempotencyKey: null,
            paidAt: null,
            payment: null,
            paymentDate: null,
            paymentMethod: null,
            paymentReference: null,
            paymentScreenshotUrl: null,
            products: [],
            storeId: null,
            updatedAt: '2026-07-17T12:00:00.000Z',
            userId: 'u1',
            userNumberId: '123',
            version: 1,
          },
        ],
        page: 1,
        pageSize: 50,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('renders page title', async () => {
    render(
      <MemoryRouter>
        <MyOrdersPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Mis compras')).toBeInTheDocument();
    });
  });

  it('shows Creación and Pago columns', async () => {
    vi.mocked(getOrderHistory).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: [
          {
            id: 'order-paid',
            status: 'paymentConfirmed',
            storeName: 'Centro',
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
            paidAt: '2026-07-19T21:10:00.000Z',
            payment: null,
            paymentDate: '2026-07-19T21:10:00.000Z',
            paymentMethod: 'mobilePayment',
            paymentReference: null,
            paymentScreenshotUrl: null,
            products: [],
            storeId: null,
            updatedAt: '2026-07-19T21:10:00.000Z',
            userId: 'u1',
            userNumberId: '123',
            version: 1,
          },
        ],
        page: 1,
        pageSize: 50,
        total: 1,
        totalPages: 1,
      },
    });

    render(
      <MemoryRouter>
        <MyOrdersPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Creación')).toBeInTheDocument();
      expect(screen.getByText('Pago')).toBeInTheDocument();
    });
  });

  it('does not show live tracking button for client web', async () => {
    render(
      <MemoryRouter>
        <MyOrdersPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Mis compras')).toBeInTheDocument();
    });
    expect(screen.queryByLabelText('Seguimiento en vivo')).not.toBeInTheDocument();
  });
});
