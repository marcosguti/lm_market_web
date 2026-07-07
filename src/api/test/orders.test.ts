import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../client';
import { confirmOrderPayment } from '../orders';

vi.mock('../client', () => ({
  api: vi.fn(),
}));

describe('orders api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('confirmOrderPayment sends multipart form fields', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    const screenshot = new File(['x'], 'proof.png', { type: 'image/png' });
    await confirmOrderPayment('order-1', {
      method: 'zelle',
      reference: 'REF1',
      paidAt: '2026-01-01T12:00:00.000Z',
      screenshot,
    });

    const [, options] = vi.mocked(client.api).mock.calls[0];
    expect(options?.method).toBe('POST');
    expect(options?.skipContentType).toBe(true);
    const formData = options?.body as FormData;
    expect(formData.get('method')).toBe('zelle');
    expect(formData.get('reference')).toBe('REF1');
    expect(formData.get('paidAt')).toBe('2026-01-01T12:00:00.000Z');
    expect(formData.get('screenshot')).toBe(screenshot);
  });
});
