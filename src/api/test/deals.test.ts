import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../client';
import { createAdminDeal, deleteAdminDeal, getActiveDeals, getAdminDeals, patchAdminDeal } from '../deals';

vi.mock('../client', () => ({ api: vi.fn() }));

describe('deals api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAdminDeals passes pagination', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { data: [] } });
    await getAdminDeals(1, 20);
    expect(client.api).toHaveBeenCalledWith('/api/admin/deals', {
      params: { page: '1', pageSize: '20' },
    });
  });

  it('getActiveDeals uses public endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { data: [] } });
    await getActiveDeals();
    expect(client.api).toHaveBeenCalledWith('/api/deals', { skipAuth: true });
  });

  it('createAdminDeal posts multipart body', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 201, data: {} });
    await createAdminDeal({
      imageFile: new File(['image'], 'deal.jpg', { type: 'image/jpeg' }),
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    expect(client.api).toHaveBeenCalledWith('/api/admin/deals', expect.objectContaining({ method: 'POST' }));
  });

  it('patchAdminDeal patches by id', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await patchAdminDeal('d1', { active: false });
    expect(client.api).toHaveBeenCalledWith('/api/admin/deals/d1', expect.objectContaining({ method: 'PATCH' }));
  });

  it('deleteAdminDeal deletes by id', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await deleteAdminDeal('d1');
    expect(client.api).toHaveBeenCalledWith('/api/admin/deals/d1', { method: 'DELETE' });
  });
});
