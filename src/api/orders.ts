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

export async function ensureCart() {
  return api<CartResponse>('/api/orders/cart');
}

export async function getOrder(orderId: string) {
  return api<CartResponse>(`/api/orders/${orderId}`);
}

export async function patchOrderLines(
  orderId: string,
  lines: { code: string; quantity: number }[]
) {
  return api<CartResponse>(`/api/orders/${orderId}/lines`, {
    body: JSON.stringify({ lines }),
    method: 'PATCH',
  });
}

export async function confirmOrderPayment(orderId: string) {
  return api<{ changes: InventoryChange[]; justConfirmed: boolean; order: OrderEntity }>(
    `/api/orders/${orderId}/confirm-payment`,
    {
      method: 'POST',
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

export async function getKitchenOrders(page: number = 1, pageSize: number = 20) {
  return api<PaginatedOrders>('/api/admin/orders/kitchen', {
    params: {
      page: String(page),
      pageSize: String(pageSize),
    },
  });
}

export async function patchAdminOrderStatus(orderId: string, status: OrderStatus) {
  return api<{ order: OrderEntity }>(`/api/admin/orders/${orderId}/status`, {
    body: JSON.stringify({ status }),
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
