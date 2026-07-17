import { Button, Empty, Image, List, Modal, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';

import type { OrderStatusHistoryEntry } from '../../types/order';

import { getOrderStatusHistory } from '../../api/orders';
import { formatDateTime } from '../../utils/formatDate';
import { formatShortOrderId } from '../../utils/orderId';
import { formatOrderStatusLabel } from '../../utils/orderStatus';

const { Text } = Typography;

interface OrderStatusHistoryModalProps {
  onClose: () => void;
  open: boolean;
  orderId: null | string;
}

export function OrderStatusHistoryModal({ onClose, open, orderId }: OrderStatusHistoryModalProps) {
  const [history, setHistory] = useState<OrderStatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !orderId) return;
    let cancelled = false;

    queueMicrotask(() => {
      void (async () => {
        setLoading(true);
        setError('');
        const result = await getOrderStatusHistory(orderId);
        if (cancelled) return;
        setLoading(false);
        if (!result.ok || !result.data?.history) {
          setHistory([]);
          setError((result.data as { error?: string })?.error ?? 'No se pudo cargar el historial');
          return;
        }
        setHistory(result.data.history);
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [open, orderId]);

  return (
    <Modal
      title={
        orderId ? `${formatShortOrderId(orderId)} Historial de estados` : 'Historial de estados'
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
      ]}
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : null}
      {!loading && error ? <Text type="danger">{error}</Text> : null}
      {!loading && !error && history.length === 0 ? (
        <Empty description="Sin cambios de estado registrados" />
      ) : null}
      {!loading && !error && history.length > 0 ? (
        <List
          dataSource={history}
          renderItem={(entry) => (
            <List.Item>
              <div className="flex w-full flex-col gap-1">
                <Text strong>
                  {formatOrderStatusLabel(entry.fromStatus)} →{' '}
                  {formatOrderStatusLabel(entry.toStatus)}
                </Text>
                <Text type="secondary" className="text-sm">
                  {formatDateTime(entry.createdAt)}
                </Text>
                <Text className="text-sm">
                  {entry.changedBy.firstName} {entry.changedBy.lastName}
                </Text>
                {entry.cancellationReason ? (
                  <div className="mt-2">
                    <Text className="text-sm text-gray-500">Motivo de cancelación</Text>
                    <Text className="mt-1 block whitespace-pre-wrap text-sm">
                      {entry.cancellationReason}
                    </Text>
                  </div>
                ) : null}
                {entry.deliveryProofUrl ? (
                  <div className="mt-2">
                    <Text className="text-sm text-gray-500">Foto de entrega</Text>
                    <div className="mt-1">
                      <Image
                        src={entry.deliveryProofUrl}
                        alt="Foto de entrega"
                        width={72}
                        height={72}
                        preview
                        style={{
                          objectFit: 'cover',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </List.Item>
          )}
        />
      ) : null}
    </Modal>
  );
}
