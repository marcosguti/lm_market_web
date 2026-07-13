import type { InventoryChange, OrderEntity, OrderStatus } from '../types/order';

import { api } from './client';

export interface CartResponse {
  changes: InventoryChange[];
  order: OrderEntity;
}

export interface PaginatedOrders {
  data: OrderEntity[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface OrderApiError {
  code?: string;
  details?: unknown;
  error?: string;
}

export async function ensureCart(storeId?: string) {
  return api<CartResponse>('/api/orders/cart', {
    params: storeId ? { storeId } : undefined,
  });
}

export async function getOrder(orderId: string) {
  return api<CartResponse>(`/api/orders/${orderId}`);
}

export async function patchOrderLines(
  orderId: string,
  lines: { code: string; quantity: number }[],
  storeId?: string
) {
  return api<CartResponse>(`/api/orders/${orderId}/lines`, {
    body: JSON.stringify({ lines, ...(storeId ? { storeId } : {}) }),
    method: 'PATCH',
  });
}

export interface ConfirmPaymentParams {
  method: 'cash' | 'zelle' | 'mobilePayment' | 'binance';
  reference?: string;
  paidAt?: string;
  screenshot?: File;
}

export async function confirmOrderPayment(orderId: string, params: ConfirmPaymentParams) {
  const formData = new FormData();
  formData.append('method', params.method);
  if (params.reference) formData.append('reference', params.reference);
  if (params.paidAt) formData.append('paidAt', params.paidAt);
  if (params.screenshot) formData.append('screenshot', params.screenshot);

  return api<{ changes: InventoryChange[]; order: OrderEntity }>(
    `/api/orders/${orderId}/confirm-payment`,
    {
      body: formData as unknown as string,
      method: 'POST',
      skipContentType: true,
    }
  );
}

export async function getOrderHistory(page: number = 1, pageSize: number = 20) {
  return api<PaginatedOrders>('/api/orders/history', {
    params: {
      page: String(page),
      pageSize: String(pageSize),
    },
  });
}

export interface KitchenOrdersFilters {
  createdFrom?: string;
  createdTo?: string;
  id?: string;
  status?: OrderStatus | 'all';
  storeId?: string;
}

export async function getKitchenOrders(
  page: number = 1,
  pageSize: number = 20,
  filters: KitchenOrdersFilters = {},
) {
  const params: Record<string, string> = {
    page: String(page),
    pageSize: String(pageSize),
  };
  if (filters.id) params.id = filters.id;
  if (filters.storeId && filters.storeId !== 'all') params.storeId = filters.storeId;
  if (filters.status && filters.status !== 'all') params.status = filters.status;
  if (filters.createdFrom) params.createdFrom = filters.createdFrom;
  if (filters.createdTo) params.createdTo = filters.createdTo;

  return api<PaginatedOrders>('/api/admin/orders/kitchen', {
    params,
  });
}

export async function patchAdminOrderStatus(orderId: string, status: OrderStatus) {
  return api<{ order: OrderEntity }>(`/api/admin/orders/${orderId}/status`, {
    body: JSON.stringify({ status }),
    method: 'PATCH',
  });
}

export async function verifyPayment(orderId: string, verify: boolean) {
  return api<{ order: OrderEntity }>(`/api/admin/orders/${orderId}/verify-payment`, {
    body: JSON.stringify({ verify }),
    method: 'PATCH',
  });
}

export async function getDeliveryAvailable(page: number = 1, pageSize: number = 20) {
  return api<PaginatedOrders>('/api/delivery/orders/available', {
    params: {
      page: String(page),
      pageSize: String(pageSize),
    },
  });
}

export async function getDeliveryMine(page: number = 1, pageSize: number = 20) {
  return api<PaginatedOrders>('/api/delivery/orders/mine', {
    params: {
      page: String(page),
      pageSize: String(pageSize),
    },
  });
}

export async function claimDeliveryOrder(orderId: string) {
  return api<{ order: OrderEntity }>(`/api/delivery/orders/${orderId}/claim`, {
    method: 'POST',
  });
}

export async function markDelivered(orderId: string) {
  return api<{ order: OrderEntity }>(`/api/delivery/orders/${orderId}/delivered`, {
    method: 'PATCH',
  });
}
