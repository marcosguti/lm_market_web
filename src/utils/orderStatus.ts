import type { OrderStatus } from '../types/order';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  assignedToDeliveryDriver: 'Asignada a repartidor',
  cancelled: 'Cancelada',
  delivered: 'Entregada',
  delivering: 'En Reparto',
  paymentConfirmed: 'Pago Confirmado',
  paymentPendingConfirmation: 'Pago por confirmar',
  pending: 'Pendiente',
  preparing: 'Preparando',
  readyForDelivery: 'Lista para Reparto',
};

/** All order statuses in workflow order (for filters). */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending',
  'paymentPendingConfirmation',
  'paymentConfirmed',
  'preparing',
  'readyForDelivery',
  'assignedToDeliveryDriver',
  'delivering',
  'delivered',
  'cancelled',
];

const CANCELLABLE_STATUSES: OrderStatus[] = [
  'pending',
  'paymentPendingConfirmation',
  'paymentConfirmed',
  'preparing',
  'readyForDelivery',
  'assignedToDeliveryDriver',
  'delivering',
];

export function canCancelOrder(status: OrderStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status);
}

export function formatOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function formatOrderStatusChangeMessage(previousStatus: string, newStatus: string): string {
  return `Tu orden cambió de ${formatOrderStatusLabel(previousStatus)} a ${formatOrderStatusLabel(newStatus)}`;
}
