import { beforeEach, describe, expect, it, vi } from 'vitest';

const localStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(),
  removeItem: vi.fn(),
  setItem: vi.fn(),
}));

vi.stubGlobal('localStorage', localStorageMock);

import { api, forceLogout, resetInflightGetsForTests, tryRefreshToken } from '../client';

describe('api client auth interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetInflightGetsForTests();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
    localStorageMock.removeItem.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('retries request after successful token refresh on 401', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'lm_market_token') return 'old-token';
      if (key === 'lm_market_refresh_token') return 'refresh-token';
      if (key === 'lm_market_device_id') return 'device-1';
      return null;
    });

    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ accessToken: 'new-token', refreshToken: 'new-refresh' }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [] }), { status: 200 }),
      );

    const result = await api<{ data: unknown[] }>('/api/orders/history');

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('lm_market_token', 'new-token');
  });

  it('forceLogout clears auth storage and dispatches event', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    forceLogout();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('lm_market_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('lm_market_refresh_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('lm_market_user');
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('tryRefreshToken returns false without refresh token', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    await expect(tryRefreshToken()).resolves.toBe(false);
  });

  it('dedupes concurrent GET requests', async () => {
    let resolveFetch!: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockReturnValue(pending);

    const first = api<{ data: unknown[] }>('/api/brands', { skipAuth: true });
    const second = api<{ data: unknown[] }>('/api/brands', { skipAuth: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch!(new Response(JSON.stringify({ data: [] }), { status: 200 }));
    const [r1, r2] = await Promise.all([first, second]);
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
  });
});
