import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../client';
import {
  createAdminProduct,
  deactivateAdminProduct,
  getAdminProducts,
  patchAdminProduct,
} from '../adminProducts';

vi.mock('../client', () => ({ api: vi.fn() }));

describe('adminProducts api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAdminProducts builds query params', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { data: [] } });
    await getAdminProducts(2, 10, 'search');
    expect(client.api).toHaveBeenCalledWith('/api/admin/products', {
      params: {
        active: 'all',
        page: '2',
        pageSize: '10',
        search: 'search',
      },
    });
  });

  it('createAdminProduct posts multipart body', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 201, data: {} });
    await createAdminProduct({
      brand: 'Brand',
      code: 'X',
      department: 'Dept',
      name: 'P',
      stores: [{ storeId: 's1', price: 1, stockQuantity: 1 }],
    });
    expect(client.api).toHaveBeenCalledWith('/api/admin/products', expect.objectContaining({ method: 'POST' }));
  });

  it('patchAdminProduct sends PATCH', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await patchAdminProduct('id-1', { name: 'New' });
    expect(client.api).toHaveBeenCalledWith('/api/admin/products/id-1', expect.objectContaining({ method: 'PATCH' }));
  });

  it('deactivateAdminProduct sends DELETE', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await deactivateAdminProduct('id-1');
    expect(client.api).toHaveBeenCalledWith('/api/admin/products/id-1', { method: 'DELETE' });
  });
});
