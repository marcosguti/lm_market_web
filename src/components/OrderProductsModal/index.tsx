import { Button, Empty, List, Modal, Typography } from 'antd';

import type { OrderEntity } from '../../types/order';

import { formatBs } from '../../constants/pricing';

const { Text } = Typography;

interface OrderProductsModalProps {
  onClose: () => void;
  open: boolean;
  order: OrderEntity | null;
}

export function OrderProductsModal({ onClose, open, order }: OrderProductsModalProps) {
  const products = order?.products ?? [];

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
      {products.length === 0 ? (
        <Empty description="Sin productos en esta orden" />
      ) : (
        <>
          <List
            dataSource={products}
            renderItem={(line) => (
              <List.Item>
                <div className="flex w-full items-center justify-between gap-4">
                  <div>
                    <Text strong>{line.name}</Text>
                    <div className="text-sm text-gray-500">
                      {line.code} · Cantidad: {line.quantity}
                    </div>
                  </div>
                  <Text>Bs {formatBs(line.lineTotal)}</Text>
                </div>
              </List.Item>
            )}
          />
          {order ? (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <Text strong>Total</Text>
              <Text strong>Bs {formatBs(order.totalAmount)}</Text>
            </div>
          ) : null}
        </>
      )}
    </Modal>
  );
}
