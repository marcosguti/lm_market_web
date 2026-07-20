import type {
  InventoryChange,
  OrderEntity,
  OrderStatus,
  OrderStatusHistoryEntry,
} from '../types/order';
import type { OrderTrackingSnapshot } from '../types/tracking';

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
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  method: 'cash' | 'zelle' | 'mobilePayment' | 'binance';
  note?: string;
  reference?: string;
  paidAt?: string;
  screenshot?: File;
}

export async function confirmOrderPayment(orderId: string, params: ConfirmPaymentParams) {
  const formData = new FormData();
  formData.append('method', params.method);
  formData.append('deliveryAddress', params.deliveryAddress);
  if (params.deliveryLatitude != null && params.deliveryLongitude != null) {
    formData.append('deliveryLatitude', String(params.deliveryLatitude));
    formData.append('deliveryLongitude', String(params.deliveryLongitude));
  }
  if (params.note) formData.append('note', params.note);
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
  filters: KitchenOrdersFilters = {}
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

export async function patchAdminOrderStatus(
  orderId: string,
  status: OrderStatus,
  cancellationReason?: string
) {
  return api<{ order: OrderEntity }>(`/api/admin/orders/${orderId}/status`, {
    body: JSON.stringify({
      status,
      ...(cancellationReason ? { cancellationReason } : {}),
    }),
    method: 'PATCH',
  });
}

export async function verifyPayment(orderId: string, verify: boolean) {
  return api<{ order: OrderEntity }>(`/api/admin/orders/${orderId}/verify-payment`, {
    body: JSON.stringify({ verify }),
    method: 'PATCH',
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

export async function assignDelivery(orderId: string, deliveryUserId: string) {
  return api<{ order: OrderEntity }>(`/api/admin/orders/${orderId}/assign-delivery`, {
    body: JSON.stringify({ deliveryUserId }),
    method: 'POST',
  });
}

export interface OrderDeliveryDriver {
  busy: boolean;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  storeId: null | string;
}

export async function getOrderDeliveryDrivers(orderId: string) {
  return api<{ drivers: OrderDeliveryDriver[] }>(
    `/api/admin/orders/${orderId}/delivery-drivers`
  );
}

export async function unassignDelivery(orderId: string) {
  return api<{ order: OrderEntity }>(`/api/admin/orders/${orderId}/unassign-delivery`, {
    method: 'POST',
  });
}

export async function startDelivery(orderId: string) {
  return api<{ order: OrderEntity }>(`/api/delivery/orders/${orderId}/start`, {
    method: 'PATCH',
  });
}

export async function markDelivered(orderId: string, deliveryProof: File) {
  const formData = new FormData();
  formData.append('deliveryProof', deliveryProof);
  return api<{ order: OrderEntity }>(`/api/delivery/orders/${orderId}/delivered`, {
    body: formData as unknown as string,
    method: 'PATCH',
    skipContentType: true,
  });
}

export async function getOrderStatusHistory(orderId: string) {
  return api<{ history: OrderStatusHistoryEntry[] }>(`/api/admin/orders/${orderId}/status-history`);
}

export async function getAdminOrderTracking(orderId: string) {
  return api<{ tracking: OrderTrackingSnapshot }>(`/api/admin/orders/${orderId}/tracking`);
}
