import { Button, Empty, List, Modal, Typography } from 'antd';

import type { OrderEntity } from '../../types/order';

import { formatBs, formatOrderTotalBs, resolveOrderUsdRate } from '../../constants/pricing';
import { useUsdRate } from '../../context/ExchangeRateContext';

const { Text } = Typography;

interface OrderProductsModalProps {
  onClose: () => void;
  open: boolean;
  order: OrderEntity | null;
}

function formatStoreName(storeName: null | string | undefined): string {
  return storeName?.trim() ? storeName : '—';
}

export function OrderProductsModal({ onClose, open, order }: OrderProductsModalProps) {
  const liveRate = useUsdRate();
  const products = order?.products ?? [];
  const orderRate = order ? resolveOrderUsdRate(order, liveRate) : liveRate;

  return (
    <Modal
      title="Productos de la orden"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
      ]}
    >
      {order ? (
        <p className="mb-4 text-sm text-gray-500">Sede: {formatStoreName(order.storeName)}</p>
      ) : null}
      {products.length === 0 ? (
        <Empty description="Sin productos en esta orden" />
      ) : (
        <>
          <List
            dataSource={products}
            renderItem={(line) => (
              <List.Item>
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                      {line.imageUrl ? (
                        <img alt="" className="h-full w-full object-cover" src={line.imageUrl} />
                      ) : (
                        <span className="text-xs text-gray-400">LM</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Text strong>{line.name}</Text>
                      <div className="text-sm text-gray-500">
                        {line.code} · Cantidad: {line.quantity}
                      </div>
                    </div>
                  </div>
                  <Text className="shrink-0">Bs {formatBs(line.lineTotal, orderRate)}</Text>
                </div>
              </List.Item>
            )}
          />
          {order ? (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <Text strong>Total</Text>
              <Text strong>Bs {formatOrderTotalBs(order, liveRate)}</Text>
            </div>
          ) : null}
        </>
      )}
    </Modal>
  );
}
