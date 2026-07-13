import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/orders', () => ({
  getKitchenOrders: vi.fn().mockResolvedValue({
    ok: true,
    data: { data: [], page: 1, pageSize: 20, total: 0, totalPages: 1 },
  }),
  patchAdminOrderStatus: vi.fn(),
  verifyPayment: vi.fn(),
}));

vi.mock('../../../api/stores', () => ({
  getStores: vi.fn().mockResolvedValue([{ id: 'store-1', name: 'Sede Centro', externalBranchCode: '001' }]),
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
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Órdenes de compra')).toBeInTheDocument();
    });
  });

  it('renders filter controls', async () => {
    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>,
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
});
