import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/orders', () => ({
  getOrderHistory: vi.fn().mockResolvedValue({
    ok: true,
    data: { data: [], page: 1, pageSize: 20, total: 0, totalPages: 1 },
  }),
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
});
