import { Alert, Button, Card, List, message, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import type { InventoryChange, OrderEntity } from '../../types/order';

import { confirmOrderPayment, ensureCart } from '../../api/orders';
import { useCart } from '../../context/CartContext';

const { Paragraph, Text, Title } = Typography;

function formatMoney(value: number) {
  return value.toLocaleString('es-VE', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function getInventoryMessage(changes: InventoryChange[]) {
  if (changes.length === 0) return null;
  return `La orden fue actualizada por inventario (${changes.length} ajuste${changes.length > 1 ? 's' : ''}).`;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { clearCart, replaceFromOrderLines } = useCart();
  const [order, setOrder] = useState<null | OrderEntity>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [inventoryAlert, setInventoryAlert] = useState<null | string>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const result = await ensureCart();
      if (cancelled) return;
      setLoading(false);
      if (!result.ok || !result.data?.order) {
        void message.error(
          (result.data as { error?: string })?.error ?? 'No se pudo cargar la orden'
        );
        return;
      }
      setOrder(result.data.order);
      replaceFromOrderLines(result.data.order.products);
      setInventoryAlert(getInventoryMessage(result.data.changes));
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [replaceFromOrderLines]);

  const canPay = useMemo(
    () => !!order && order.status === 'pendiente' && order.products.length > 0,
    [order]
  );

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    const result = await confirmOrderPayment(order.id);
    setPaying(false);

    if (!result.ok) {
      const payload = result.data as {
        code?: string;
        details?: { changes?: InventoryChange[]; order?: OrderEntity };
        error?: string;
      };
      if (
        payload?.code === 'ORDER_INVENTORY_CHANGED' ||
        payload?.code === 'ORDER_EMPTY_AFTER_ADJUSTMENT'
      ) {
        const updatedOrder = payload.details?.order;
        if (updatedOrder) {
          setOrder(updatedOrder);
          replaceFromOrderLines(updatedOrder.products);
        }
        setInventoryAlert(payload.error ?? 'La orden cambió por inventario');
        return;
      }
      void message.error(payload?.error ?? 'No se pudo confirmar el pago');
      return;
    }

    if (!result.data?.order) {
      void message.error('No se recibió la orden actualizada');
      return;
    }

    setOrder(result.data.order);
    setInventoryAlert(getInventoryMessage(result.data.changes));
    if (result.data.order.status === 'pagoConfirmado') {
      clearCart();
      void message.success('Pago confirmado');
      navigate('/mis-compras');
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Space direction="vertical" size={16} className="w-full">
        <Title level={2} className="!mb-0">
          Checkout
        </Title>
        <Paragraph className="!mb-0 text-gray-600">
          Tu carrito está representado por una orden en estado pendiente y se valida con inventario
          real antes de pagar.
        </Paragraph>
        {inventoryAlert ? <Alert type="warning" message={inventoryAlert} showIcon /> : null}
        <Card loading={loading} title="Resumen de orden">
          {!order ? (
            <Paragraph>
              No hay orden pendiente. <Link to="/">Ir al catálogo</Link>
            </Paragraph>
          ) : (
            <Space direction="vertical" size={12} className="w-full">
              <Text>
                Estado: <strong>{order.status}</strong>
              </Text>
              <List
                dataSource={order.products}
                renderItem={(line) => (
                  <List.Item>
                    <div className="flex w-full items-center justify-between gap-4">
                      <div>
                        <Text strong>{line.name}</Text>
                        <div className="text-sm text-gray-500">
                          {line.code} · Cantidad: {line.quantity}
                        </div>
                      </div>
                      <Text>REF {formatMoney(line.lineTotal)}</Text>
                    </div>
                  </List.Item>
                )}
              />
              <div className="flex items-center justify-between border-t pt-4">
                <Text strong>Total</Text>
                <Text strong>REF {formatMoney(order.totalAmount)}</Text>
              </div>
              <Button type="primary" loading={paying} disabled={!canPay} onClick={handlePay}>
                Pagar ahora
              </Button>
            </Space>
          )}
        </Card>
      </Space>
    </section>
  );
};

export default CheckoutPage;
