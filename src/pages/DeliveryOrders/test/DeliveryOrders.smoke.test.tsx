import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const socketOn = vi.fn();
const socketOff = vi.fn();

vi.mock('../../../api/orders', () => ({
  getDeliveryMine: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      data: [
        {
          id: 'order-delivery-1',
          status: 'delivering',
          deliveryAddress:
            'Calle muy larga de ejemplo que debería truncarse con elipsis en la tabla de entregas',
          deliveryPhone: '04141234567',
          products: [],
          totalAmount: 10,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          userId: 'u1',
        },
      ],
      page: 1,
      pageSize: 100,
      total: 1,
      totalPages: 1,
    },
  }),
  markDelivered: vi.fn(),
  startDelivery: vi.fn(),
}));

vi.mock('../../../realtime/socket', () => ({
  connectSocket: vi.fn(() => ({ on: socketOn, off: socketOff })),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => ({ on: socketOn, off: socketOff })),
}));

import DeliveryOrdersPage from '../index';

describe('DeliveryOrders page smoke', () => {
  beforeEach(() => {
    localStorage.setItem('lm_market_token', 'test-token');
    socketOn.mockClear();
    socketOff.mockClear();
  });

  it('renders delivery panel title', async () => {
    render(
      <MemoryRouter>
        <DeliveryOrdersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Panel de reparto')).toBeInTheDocument();
    });
  });

  it('shows Datos de envío with truncated address and phone', async () => {
    render(
      <MemoryRouter>
        <DeliveryOrdersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Datos de envío')).toBeInTheDocument();
      const address = screen.getByText(
        'Calle muy larga de ejemplo que debería truncarse con elipsis en la tabla de entregas'
      );
      expect(address).toHaveClass('truncate', 'cursor-pointer');
      expect(screen.getByText('04141234567')).toBeInTheDocument();
    });
  });

  it('subscribes to order realtime events', async () => {
    render(
      <MemoryRouter>
        <DeliveryOrdersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(socketOn).toHaveBeenCalledWith('order:updated', expect.any(Function));
      expect(socketOn).toHaveBeenCalledWith('order:cancelled', expect.any(Function));
    });
  });
});
