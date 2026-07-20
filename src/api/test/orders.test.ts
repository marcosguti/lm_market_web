import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../client';
import {
  confirmOrderPayment,
  ensureCart,
  getAdminOrderTracking,
  getDeliveryMine,
  getKitchenOrders,
  getOrder,
  getOrderDeliveryDrivers,
  getOrderHistory,
  markDelivered,
  patchOrderLines,
  startDelivery,
} from '../orders';

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
      customerNotes: 'Portón azul',
      deliveryAddress: 'Calle 123',
      deliveryLatitude: 10.48,
      deliveryLongitude: -66.9,
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
    expect(formData.get('customerNotes')).toBe('Portón azul');
    expect(formData.get('deliveryAddress')).toBe('Calle 123');
    expect(formData.get('deliveryLatitude')).toBe('10.48');
    expect(formData.get('deliveryLongitude')).toBe('-66.9');
    expect(formData.get('reference')).toBe('REF1');
    expect(formData.get('paidAt')).toBe('2026-01-01T12:00:00.000Z');
    expect(formData.get('screenshot')).toBe(screenshot);
  });

  it('getKitchenOrders calls admin kitchen endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { data: [] } });
    await getKitchenOrders(1, 20);
    expect(client.api).toHaveBeenCalledWith('/api/admin/orders/kitchen', {
      params: { page: '1', pageSize: '20' },
    });
  });

  it('getOrderDeliveryDrivers calls delivery-drivers endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { drivers: [] } });
    await getOrderDeliveryDrivers('order-1');
    expect(client.api).toHaveBeenCalledWith('/api/admin/orders/order-1/delivery-drivers');
  });

  it('getKitchenOrders passes optional filters', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { data: [] } });
    await getKitchenOrders(2, 50, {
      createdFrom: '2026-07-01',
      createdTo: '2026-07-13',
      id: 'abc-123',
      status: 'preparing',
      storeId: 'store-1',
    });
    expect(client.api).toHaveBeenCalledWith('/api/admin/orders/kitchen', {
      params: {
        createdFrom: '2026-07-01',
        createdTo: '2026-07-13',
        id: 'abc-123',
        page: '2',
        pageSize: '50',
        status: 'preparing',
        storeId: 'store-1',
      },
    });
  });

  it('startDelivery patches start endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await startDelivery('order-1');
    expect(client.api).toHaveBeenCalledWith('/api/delivery/orders/order-1/start', {
      method: 'PATCH',
    });
  });

  it('markDelivered patches delivered endpoint with proof file', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    const proof = new File(['x'], 'proof.jpg', { type: 'image/jpeg' });
    await markDelivered('order-1', proof);
    const [, options] = vi.mocked(client.api).mock.calls[0];
    expect(options?.method).toBe('PATCH');
    expect(options?.skipContentType).toBe(true);
    const formData = options?.body as FormData;
    expect(formData.get('deliveryProof')).toBe(proof);
  });

  it('ensureCart calls cart endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await ensureCart('store-1');
    expect(client.api).toHaveBeenCalledWith('/api/orders/cart', {
      params: { storeId: 'store-1' },
    });
  });

  it('getOrder fetches order by id', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await getOrder('order-1');
    expect(client.api).toHaveBeenCalledWith('/api/orders/order-1');
  });

  it('patchOrderLines sends lines payload', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await patchOrderLines('order-1', [{ code: 'SKU', quantity: 2 }]);
    expect(client.api).toHaveBeenCalledWith('/api/orders/order-1/lines', {
      body: JSON.stringify({ lines: [{ code: 'SKU', quantity: 2 }] }),
      method: 'PATCH',
    });
  });

  it('getOrderHistory passes pagination', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { data: [] } });
    await getOrderHistory(1, 20);
    expect(client.api).toHaveBeenCalledWith('/api/orders/history', {
      params: { page: '1', pageSize: '20' },
    });
  });

  it('getDeliveryMine calls mine endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { data: [] } });
    await getDeliveryMine(1, 20);
    expect(client.api).toHaveBeenCalledWith('/api/delivery/orders/mine', {
      params: { page: '1', pageSize: '20' },
    });
  });

  it('confirmOrderPayment omits coordinates when not provided', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: {} });
    await confirmOrderPayment('order-1', {
      deliveryAddress: 'Calle 123',
      method: 'cash',
    });

    const [, options] = vi.mocked(client.api).mock.calls[0];
    const formData = options?.body as FormData;
    expect(formData.get('deliveryAddress')).toBe('Calle 123');
    expect(formData.get('deliveryLatitude')).toBeNull();
    expect(formData.get('deliveryLongitude')).toBeNull();
  });

  it('getAdminOrderTracking calls admin tracking endpoint', async () => {
    vi.mocked(client.api).mockResolvedValue({ ok: true, status: 200, data: { tracking: {} } });
    await getAdminOrderTracking('order-1');
    expect(client.api).toHaveBeenCalledWith('/api/admin/orders/order-1/tracking');
  });
});
