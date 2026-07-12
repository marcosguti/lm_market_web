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

vi.mock('../../../realtime/socket', () => ({
  connectSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
}));

import AdminOrdersPage from '../index';

describe('AdminOrders page smoke', () => {
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
});
