import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const historyPayload = {
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
  pageSize: 10,
  total: 3,
  totalPages: 1,
};

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
      data: historyPayload,
    });
  });

  it('renders page title and filter toolbar', async () => {
    render(
      <MemoryRouter>
        <MyOrdersPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Mis compras')).toBeInTheDocument();
    });
    expect(screen.getByText(/pedidos/)).toBeInTheDocument();
    expect(screen.getByText(/realizados en/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar todos los pedidos')).toBeInTheDocument();
    expect(getOrderHistory).toHaveBeenCalledWith(
      1,
      10,
      expect.objectContaining({
        createdFrom: expect.any(String),
        createdTo: expect.any(String),
      }),
    );
  });

  it('shows order card labels instead of table columns', async () => {
    render(
      <MemoryRouter>
        <MyOrdersPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Pedido realizado')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Sede')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ver detalle' })).toBeInTheDocument();
    });
  });

  it('searches with q on Buscar', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MyOrdersPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar todos los pedidos')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Buscar todos los pedidos'), 'leche');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => {
      expect(getOrderHistory).toHaveBeenCalledWith(
        1,
        10,
        expect.objectContaining({ q: 'leche' }),
      );
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
