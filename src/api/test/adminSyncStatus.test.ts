import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getAdminSyncStatus,
  isBcvSyncDetails,
  isProductSyncDetails,
} from '../adminSyncStatus';

vi.mock('../client', () => ({
  api: vi.fn(),
}));

import { api } from '../client';

describe('adminSyncStatus api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/admin/sync-status', async () => {
    vi.mocked(api).mockResolvedValue({
      ok: true,
      data: { data: { ok: true, bcv: {}, products: {} } },
    } as never);

    await getAdminSyncStatus();

    expect(api).toHaveBeenCalledWith('/api/admin/sync-status');
  });
});

describe('sync details type guards', () => {
  it('accepts product sync details shape', () => {
    expect(
      isProductSyncDetails({
        incompleteStoreCount: 0,
        storeFailures: 0,
        stores: [
          {
            branch: 1,
            complete: true,
            deactivated: 0,
            failed: false,
            pageErrors: 0,
            rowErrors: 0,
            storeName: 'Las Americas',
            upserted: 10,
          },
        ],
        storesTotal: 1,
      }),
    ).toBe(true);
  });

  it('rejects incomplete product details', () => {
    expect(isProductSyncDetails({ storeFailures: 1 })).toBe(false);
    expect(isProductSyncDetails(null)).toBe(false);
  });

  it('accepts bcv sync details shape', () => {
    expect(
      isBcvSyncDetails({
        fetchedAt: '2026-07-20T08:00:00.000Z',
        rate: 736.93,
        source: 'bcv',
      }),
    ).toBe(true);
  });

  it('rejects invalid bcv details', () => {
    expect(isBcvSyncDetails({ rate: 'x', source: 'bcv' })).toBe(false);
    expect(isBcvSyncDetails({ rate: 1, source: 'bcv', fetchedAt: 1 })).toBe(false);
  });
});
