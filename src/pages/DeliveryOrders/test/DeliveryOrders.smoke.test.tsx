import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/orders', () => ({
  claimDeliveryOrder: vi.fn(),
  getDeliveryAvailable: vi.fn().mockResolvedValue({
    ok: true,
    data: { data: [], page: 1, pageSize: 100, total: 0, totalPages: 1 },
  }),
  getDeliveryMine: vi.fn().mockResolvedValue({
    ok: true,
    data: { data: [], page: 1, pageSize: 100, total: 0, totalPages: 1 },
  }),
  markDelivered: vi.fn(),
}));

import DeliveryOrdersPage from '../index';

describe('DeliveryOrders page smoke', () => {
  it('renders delivery panel title', async () => {
    render(
      <MemoryRouter>
        <DeliveryOrdersPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Panel de reparto')).toBeInTheDocument();
    });
  });
});
