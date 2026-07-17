import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/adminProducts', () => ({
  createAdminProduct: vi.fn(),
  deactivateAdminProduct: vi.fn(),
  getAdminProducts: vi.fn().mockResolvedValue({
    ok: true,
    data: { data: [], page: 1, pageSize: 20, total: 0, totalPages: 1 },
  }),
  patchAdminProduct: vi.fn(),
}));

vi.mock('../../../api/stores', () => ({
  getStores: vi.fn().mockResolvedValue([{ id: 's1', name: 'Store 1' }]),
}));

import AdminProducts from '../index';

describe('AdminProducts page smoke', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders products title for admin', async () => {
    render(
      <MemoryRouter>
        <AdminProducts />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Productos')).toBeInTheDocument();
  });
});
