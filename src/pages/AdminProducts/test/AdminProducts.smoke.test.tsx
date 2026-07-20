import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  getStores: vi.fn().mockResolvedValue([{ id: 's1', name: 'Las Americas' }]),
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

  it('shows Precio and Stock labels in create modal store tab', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminProducts />
      </MemoryRouter>,
    );
    await screen.findByText('Productos');
    await user.click(screen.getByRole('button', { name: /nuevo producto/i }));
    await user.click(await screen.findByText('Precios por tienda'));
    await waitFor(() => {
      expect(screen.getByLabelText('Precio')).toBeInTheDocument();
      expect(screen.getByLabelText('Stock')).toBeInTheDocument();
      expect(screen.getByText('Las Americas')).toBeInTheDocument();
    });
  });
});
