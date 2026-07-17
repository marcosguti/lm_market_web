import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchBrands, fetchDepartments } from '../catalog';
import * as client from '../client';
import { getStores } from '../stores';

vi.mock('../client', () => ({ api: vi.fn() }));

describe('catalog and stores api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetchBrands calls public brands endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { data: [] } });
    await fetchBrands();
    expect(client.api).toHaveBeenCalledWith('/api/brands', { skipAuth: true });
  });

  it('fetchDepartments calls public departments endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { data: [] } });
    await fetchDepartments();
    expect(client.api).toHaveBeenCalledWith('/api/departments', { skipAuth: true });
  });

  it('getStores returns store list', async () => {
    vi.mocked(client.api).mockResolvedValue({
      ok: true,
      status: 200,
      data: [{ id: 's1', name: 'Store', externalBranchCode: '001' }],
    });
    const stores = await getStores();
    expect(client.api).toHaveBeenCalledWith('/api/stores', { skipAuth: true });
    expect(stores).toHaveLength(1);
  });
});
