import type { ReactNode } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPaymentConfig } from '../../api/payments';
import { ExchangeRateProvider, useUsdRate } from '../ExchangeRateContext';

vi.mock('../../api/payments', () => ({
  getPaymentConfig: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <ExchangeRateProvider>{children}</ExchangeRateProvider>;
}

describe('ExchangeRateContext', () => {
  beforeEach(() => {
    vi.mocked(getPaymentConfig).mockResolvedValue({
      data: { megasoftEnabled: false, merchant: { bankCode: '', bankName: '', phone: '', rif: '' }, usdRate: 725.762 },
      ok: true,
      status: 200,
    });
  });

  it('loads usdRate from payment config', async () => {
    const { result } = renderHook(() => useUsdRate(), { wrapper });
    await waitFor(() => {
      expect(result.current).toBe(725.762);
    });
  });
});
