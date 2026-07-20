import { Button, Card, Tag } from 'antd';

import type { OrderEntity } from '../../types/order';

import { formatOrderTotalBs } from '../../constants/pricing';
import { formatDateTime } from '../../utils/formatDate';
import { ORDER_STATUS_LABELS } from '../../utils/orderStatus';
import { ShortOrderId } from '../ShortOrderId';

const STATUS_COLOR: Record<string, string> = {
  assignedToDeliveryDriver: 'geekblue',
  cancelled: 'red',
  delivering: 'blue',
  delivered: 'green',
  paymentConfirmed: 'gold',
  paymentPendingConfirmation: 'orange',
  pending: 'default',
  preparing: 'purple',
  readyForDelivery: 'cyan',
};

interface OrderHistoryCardProps {
  onViewDetail: (order: OrderEntity) => void;
  order: OrderEntity;
  usdRate: null | number;
}

function formatStoreName(storeName: null | string | undefined): string {
  return storeName?.trim() ? storeName : '—';
}

function orderPlacedAt(order: OrderEntity): string {
  const paymentDate = order.paymentDate?.trim();
  return formatDateTime(paymentDate || order.createdAt);
}

export function OrderHistoryCard({ onViewDetail, order, usdRate }: OrderHistoryCardProps) {
  const statusLabel =
    ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status;

  return (
    <Card
      className="overflow-hidden"
      styles={{ body: { padding: 0 } }}
      data-testid="order-history-card"
    >
      <div className="grid grid-cols-2 gap-3 bg-gray-50 px-4 py-3 sm:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Pedido realizado</div>
          <div className="text-sm font-medium text-gray-900">{orderPlacedAt(order)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Total</div>
          <div className="text-sm font-medium text-gray-900">
            Bs {formatOrderTotalBs(order, usdRate)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Sede</div>
          <div className="text-sm font-medium text-gray-900">{formatStoreName(order.storeName)}</div>
        </div>
        <div className="sm:text-right">
          <div className="text-xs uppercase tracking-wide text-gray-500">Orden</div>
          <div className="text-sm font-medium text-gray-900">
            <ShortOrderId id={order.id} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Tag color={STATUS_COLOR[order.status] ?? 'default'}>{statusLabel}</Tag>
        </div>
        <Button type="default" onClick={() => onViewDetail(order)}>
          Ver detalle
        </Button>
      </div>
    </Card>
  );
}
