import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../client';
import { getAdminUsers, createAdminUser, patchAdminUser, deleteAdminUser, verifyAdminUserEmail } from '../adminUsers';

vi.mock('../client', () => ({
  api: vi.fn(),
}));

describe('adminUsers api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAdminUsers calls users endpoint with pagination', async () => {
    vi.mocked(client.api).mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [], page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    await getAdminUsers(2, 10, 'ana');
    expect(client.api).toHaveBeenCalledWith('/api/admin/users', {
      params: { page: '2', pageSize: '10', search: 'ana' },
    });
  });

  it('createAdminUser posts JSON body', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 201, data: {} });
    await createAdminUser({
      email: 'u@test.com',
      firstName: 'U',
      lastName: 'Ser',
      numberId: '1',
      numberIdType: 'V',
      type: 'client',
    });
    expect(client.api).toHaveBeenCalledWith('/api/admin/users', expect.objectContaining({ method: 'POST' }));
  });

  it('patchAdminUser patches user', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await patchAdminUser('u1', { firstName: 'New' });
    expect(client.api).toHaveBeenCalledWith('/api/admin/users/u1', expect.objectContaining({ method: 'PATCH' }));
  });

  it('deleteAdminUser deletes user', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await deleteAdminUser('u1');
    expect(client.api).toHaveBeenCalledWith('/api/admin/users/u1', { method: 'DELETE' });
  });

  it('verifyAdminUserEmail posts verify endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await verifyAdminUserEmail('u1');
    expect(client.api).toHaveBeenCalledWith('/api/admin/users/u1/verify-email', { method: 'POST' });
  });
});
