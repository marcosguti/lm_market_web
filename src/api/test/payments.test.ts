import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../client';
import { getPaymentBanks, getPaymentConfig, verifyMobilePayment } from '../payments';

vi.mock('../client', () => ({
  api: vi.fn(),
}));

describe('payments api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPaymentConfig calls public config endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({
      ok: true,
      status: 200,
      data: { megasoftEnabled: false },
    });
    await getPaymentConfig();
    expect(client.api).toHaveBeenCalledWith('/api/payments/config', { skipAuth: true });
  });

  it('getPaymentBanks calls banks endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { banks: [] } });
    await getPaymentBanks();
    expect(client.api).toHaveBeenCalledWith('/api/payments/banks', { skipAuth: true });
  });

  it('verifyMobilePayment posts JSON body', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    const params = {
      amount: 10,
      bankCode: '0105',
      deliveryAddress: 'Calle 123',
      nationalId: 'V12345678',
      phone: '04141234567',
      reference: 'REF1',
    };
    await verifyMobilePayment('order-1', params);
    expect(client.api).toHaveBeenCalledWith('/api/orders/order-1/verify-mobile-payment', {
      body: JSON.stringify(params),
      method: 'POST',
    });
  });
});
