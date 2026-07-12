import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../client';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../notifications';

vi.mock('../client', () => ({ api: vi.fn() }));

describe('notifications api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getNotifications passes pagination', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { data: [] } });
    await getNotifications(2, 10);
    expect(client.api).toHaveBeenCalledWith('/api/notifications', {
      params: { page: '2', pageSize: '10' },
    });
  });

  it('markNotificationRead patches notification', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await markNotificationRead('n1');
    expect(client.api).toHaveBeenCalledWith('/api/notifications/n1/read', { method: 'PATCH' });
  });

  it('markAllNotificationsRead posts bulk endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await markAllNotificationsRead();
    expect(client.api).toHaveBeenCalledWith('/api/notifications/read-all', { method: 'POST' });
  });
});
