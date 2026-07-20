import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getKitchenOrders } from '../../../api/orders';
import { resolveOrderPeriodDates } from '../../../utils/orderPeriodFilter';
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from '../../../utils/orderStatus';
import { ADMIN_ORDERS_FILTERS_KEY } from '../filtersStorage';

vi.mock('../../../api/orders', () => ({
  assignDelivery: vi.fn(),
  getAdminOrderTracking: vi.fn(),
  getKitchenOrders: vi.fn().mockResolvedValue({
    ok: true,
    data: { data: [], page: 1, pageSize: 20, total: 0, totalPages: 1 },
  }),
  getOrderDeliveryDrivers: vi.fn().mockResolvedValue({
    ok: true,
    data: { drivers: [] },
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

const authState = vi.hoisted(() => ({
  user: { id: 'super-1', storeId: null as null | string, type: 'superAdmin' },
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    isLoading: false,
    user: authState.user,
  }),
}));

import AdminOrdersPage from '../index';

describe('AdminOrders page smoke', () => {
  beforeEach(() => {
    localStorage.setItem('lm_market_token', 'test-token');
    localStorage.removeItem(ADMIN_ORDERS_FILTERS_KEY);
    authState.user = { id: 'super-1', storeId: null, type: 'superAdmin' };
    vi.mocked(getKitchenOrders).mockClear();
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

  it('shows Creación and Pago columns', async () => {
    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Creación')).toBeInTheDocument();
      expect(screen.getByText('Pago')).toBeInTheDocument();
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

  it('hides store filter and omits storeId for store-scoped admin', async () => {
    authState.user = { id: 'admin-1', storeId: 'store-1', type: 'admin' };
    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Órdenes de compra')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('filter-store')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(getKitchenOrders).toHaveBeenCalled();
      const lastCall = vi.mocked(getKitchenOrders).mock.calls.at(-1);
      expect(lastCall?.[2]).not.toHaveProperty('storeId');
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

  it('restores filters from localStorage and fetches with them', async () => {
    localStorage.setItem(
      ADMIN_ORDERS_FILTERS_KEY,
      JSON.stringify({
        orderIdFilter: 'order-99',
        periodFilter: 'thisWeek',
        statusFilter: 'preparing',
        storeFilter: 'store-1',
      })
    );

    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    const periodDates = resolveOrderPeriodDates('thisWeek');

    await waitFor(() => {
      expect(getKitchenOrders).toHaveBeenCalledWith(1, 100, {
        ...periodDates,
        id: 'order-99',
        status: 'preparing',
        storeId: 'store-1',
      });
    });

    expect(screen.getByPlaceholderText('Buscar por ID')).toHaveValue('order-99');
  });

  it('persists filter changes to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    await screen.findByText('Órdenes de compra');

    const statusFilter = screen.getByTestId('filter-status');
    await user.click(within(statusFilter).getByRole('combobox'));
    await user.click(await screen.findByText(ORDER_STATUS_LABELS.preparing));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(ADMIN_ORDERS_FILTERS_KEY)!);
      expect(saved.statusFilter).toBe('preparing');
    });
  });
});
