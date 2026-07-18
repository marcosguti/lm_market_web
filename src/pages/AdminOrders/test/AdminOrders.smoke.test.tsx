import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from '../../../utils/orderStatus';

vi.mock('../../../api/orders', () => ({
  assignDelivery: vi.fn(),
  getAdminOrderTracking: vi.fn(),
  getKitchenOrders: vi.fn().mockResolvedValue({
    ok: true,
    data: { data: [], page: 1, pageSize: 20, total: 0, totalPages: 1 },
  }),
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
  getStores: vi
    .fn()
    .mockResolvedValue([{ id: 'store-1', name: 'Sede Centro', externalBranchCode: '001' }]),
}));

vi.mock('../../../realtime/socket', () => ({
  connectSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
}));

import AdminOrdersPage from '../index';

describe('AdminOrders page smoke', () => {
  beforeEach(() => {
    localStorage.setItem('lm_market_token', 'test-token');
  });

  it('renders kitchen orders title', async () => {
    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Órdenes de compra')).toBeInTheDocument();
    });
  });

  it('renders filter controls', async () => {
    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('filter-order-id')).toHaveTextContent('Order ID');
      expect(screen.getByTestId('filter-store')).toHaveTextContent('Sede');
      expect(screen.getByTestId('filter-status')).toHaveTextContent('Estado');
      expect(screen.getByTestId('filter-period')).toHaveTextContent('Período');
      expect(screen.getByPlaceholderText('Buscar por ID')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
      expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(3);
    });
  });

  it('status filter lists Todos and every order status except pending', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    const statusFilter = await screen.findByTestId('filter-status');
    await user.click(within(statusFilter).getByRole('combobox'));

    await waitFor(() => {
      const labels = Array.from(document.querySelectorAll('.ant-select-item-option-content')).map(
        (el) => el.textContent
      );
      expect(labels).toEqual([
        'Todos',
        ...ORDER_STATUS_FLOW.filter((status) => status !== 'pending').map(
          (status) => ORDER_STATUS_LABELS[status]
        ),
      ]);
      expect(labels).not.toContain('Pendiente');
    });
  });
});
