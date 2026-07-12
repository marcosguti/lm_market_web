import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/banners', () => ({
  createAdminBanner: vi.fn(),
  deleteAdminBanner: vi.fn(),
  getAdminBanners: vi.fn().mockResolvedValue({ ok: true, data: { data: [] } }),
  patchAdminBanner: vi.fn(),
}));

import AdminBanners from '../index';

describe('AdminBanners page smoke', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders banners title for admin', async () => {
    render(
      <MemoryRouter>
        <AdminBanners />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Banners')).toBeInTheDocument();
  });
});
