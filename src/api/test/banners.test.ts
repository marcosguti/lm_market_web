import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAdminBanner, deleteAdminBanner, getActiveBanners, getAdminBanners, patchAdminBanner } from '../banners';
import * as client from '../client';

vi.mock('../client', () => ({ api: vi.fn() }));

describe('banners api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAdminBanners calls admin endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { data: [] } });
    await getAdminBanners();
    expect(client.api).toHaveBeenCalledWith('/api/admin/banners');
  });

  it('getActiveBanners uses skipAuth', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { data: [] } });
    await getActiveBanners();
    expect(client.api).toHaveBeenCalledWith('/api/banners', { skipAuth: true });
  });

  it('createAdminBanner posts body', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 201, data: {} });
    await createAdminBanner({ title: 'B', active: true });
    expect(client.api).toHaveBeenCalledWith('/api/admin/banners', expect.objectContaining({ method: 'POST' }));
  });

  it('patchAdminBanner patches by id', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await patchAdminBanner('b1', { title: 'Updated' });
    expect(client.api).toHaveBeenCalledWith('/api/admin/banners/b1', expect.objectContaining({ method: 'PATCH' }));
  });

  it('deleteAdminBanner deletes by id', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await deleteAdminBanner('b1');
    expect(client.api).toHaveBeenCalledWith('/api/admin/banners/b1', { method: 'DELETE' });
  });
});
