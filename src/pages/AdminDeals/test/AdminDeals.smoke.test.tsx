import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/deals', () => ({
  createAdminDeal: vi.fn(),
  deleteAdminDeal: vi.fn(),
  getAdminDeals: vi.fn().mockResolvedValue({
    ok: true,
    data: { data: [], page: 1, pageSize: 10, total: 0, totalPages: 1 },
  }),
  patchAdminDeal: vi.fn(),
}));

import AdminDeals from '../index';

describe('AdminDeals page smoke', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders deals title for admin', async () => {
    render(
      <MemoryRouter>
        <AdminDeals />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Ofertas')).toBeInTheDocument();
  });
});
