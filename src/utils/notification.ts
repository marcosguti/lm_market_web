import { formatShortOrderId } from './orderId';
import { formatOrderStatusChangeMessage, formatOrderStatusLabel } from './orderStatus';

export function formatNotificationTitle(title: string, orderId: null | string): string {
  if (!orderId) {
    return title;
  }
  return `${formatShortOrderId(orderId)} · ${title}`;
}

export function formatNotificationBody(
  body: string,
  payload?: null | Record<string, unknown>,
  type?: string
): string {
  if (type === 'ORDER_STATUS_CHANGED' && payload) {
    const previousStatus = payload.previousStatus;
    const newStatus = payload.newStatus;
    if (typeof previousStatus === 'string' && typeof newStatus === 'string') {
      return formatOrderStatusChangeMessage(previousStatus, newStatus);
    }
  }

  const match = body.match(/^Tu orden cambió de (\w+) a (\w+)$/);
  if (match) {
    return formatOrderStatusChangeMessage(match[1], match[2]);
  }

  return body.replace(
    /\b(pending|paymentPendingConfirmation|paymentConfirmed|preparing|readyForDelivery|assignedToDeliveryDriver|delivering|delivered|cancelled)\b/g,
    (status) => formatOrderStatusLabel(status)
  );
}
