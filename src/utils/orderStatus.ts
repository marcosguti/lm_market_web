import type { OrderStatus } from '../types/order';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  cancelled: 'Cancelada',
  delivered: 'Entregada',
  outForDelivery: 'En Reparto',
  paymentConfirmed: 'Pago Confirmado',
  pending: 'Pendiente',
  preparing: 'Preparando',
  readyForDelivery: 'Lista para Reparto',
};

const CANCELLABLE_STATUSES: OrderStatus[] = ['pending', 'paymentConfirmed', 'preparing'];

export function canCancelOrder(status: OrderStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status);
}

export function formatOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function formatOrderStatusChangeMessage(previousStatus: string, newStatus: string): string {
  return `Tu orden cambió de ${formatOrderStatusLabel(previousStatus)} a ${formatOrderStatusLabel(newStatus)}`;
}
