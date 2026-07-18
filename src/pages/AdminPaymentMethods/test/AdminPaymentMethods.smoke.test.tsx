import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/adminPaymentMethods', () => ({
  getAdminPaymentMethods: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      data: [
        {
          active: true,
          information: null,
          method: 'cash',
          noteEnabled: true,
          placeholder: 'Toma una foto legible del billete',
          updatedAt: '2026-07-18T00:00:00.000Z',
        },
        {
          active: true,
          information: 'Cuenta Zelle demo',
          method: 'zelle',
          noteEnabled: true,
          placeholder: null,
          updatedAt: '2026-07-18T00:00:00.000Z',
        },
      ],
    },
  }),
  patchAdminPaymentMethod: vi.fn(),
}));

import AdminPaymentMethods from '../index';

describe('AdminPaymentMethods smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders payment methods table', async () => {
    render(
      <MemoryRouter>
        <AdminPaymentMethods />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Métodos de pago')).toBeInTheDocument();
      expect(screen.getByText('Efectivo')).toBeInTheDocument();
      expect(screen.getByText('Zelle')).toBeInTheDocument();
    });
  });
});
