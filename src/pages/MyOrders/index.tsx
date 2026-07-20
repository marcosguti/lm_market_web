import { EyeOutlined } from '@ant-design/icons';
import { Alert, Button, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';

import type { OrderEntity } from '../../types/order';

import { getOrderHistory } from '../../api/orders';
import { OrderProductsModal } from '../../components/OrderProductsModal';
import { ShortOrderId } from '../../components/ShortOrderId';
import { formatOrderTotalBs } from '../../constants/pricing';
import { useUsdRate } from '../../context/ExchangeRateContext';
import { connectSocket } from '../../realtime/socket';
import { formatDateTime } from '../../utils/formatDate';
import { ORDER_STATUS_LABELS } from '../../utils/orderStatus';

const { Title } = Typography;

const TOKEN_KEY = 'lm_market_token';

const statusColor: Record<string, string> = {
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

interface OrderUpdatedPayload {
  id: string;
  status: string;
  totalAmount: number;
}

const MyOrdersPage = () => {
  const usdRate = useUsdRate();
  const [data, setData] = useState<OrderEntity[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [productsModal, setProductsModal] = useState<{
    open: boolean;
    order: OrderEntity | null;
  }>({ open: false, order: null });

  const refetchOrders = useCallback(async () => {
    setLoading(true);
    const result = await getOrderHistory(1, 50);
    setLoading(false);
    if (!result.ok || !result.data?.data) {
      setError((result.data as { error?: string })?.error ?? 'No se pudo cargar el historial');
      return;
    }
    setData(result.data.data);
    setError('');
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const result = await getOrderHistory(1, 50);
      if (cancelled) return;
      setLoading(false);
      if (!result.ok || !result.data?.data) {
        setError((result.data as { error?: string })?.error ?? 'No se pudo cargar el historial');
        return;
      }
      setData(result.data.data);
      setError('');
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const socket = connectSocket(token);

    const onOrderUpdated = (payload: OrderUpdatedPayload) => {
      setData((prev) => {
        const exists = prev.some((order) => order.id === payload.id);
        if (!exists) return prev;
        return prev.map((order) =>
          order.id === payload.id
            ? { ...order, status: payload.status as OrderEntity['status'] }
            : order
        );
      });
      if (payload.status !== 'pending') {
        void refetchOrders();
      }
    };

    socket.on('order:updated', onOrderUpdated);

    return () => {
      socket.off('order:updated', onOrderUpdated);
    };
  }, [refetchOrders]);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Title level={2}>Mis compras</Title>
      {error ? <Alert type="error" showIcon message={error} className="mb-4" /> : null}
      <Table
        loading={loading}
        rowKey="id"
        dataSource={data}
        columns={[
          {
            title: 'Orden',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => <ShortOrderId id={id} />,
          },
          {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
              <Tag color={statusColor[status] ?? 'default'}>
                {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status}
              </Tag>
            ),
          },
          {
            title: 'Sede',
            dataIndex: 'storeName',
            key: 'storeName',
            render: (value: string | null | undefined) => value?.trim() || '—',
          },
          {
            title: 'Total',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (_value: number, row: OrderEntity) => `Bs ${formatOrderTotalBs(row, usdRate)}`,
          },
          {
            title: 'Creación',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (value: string) => formatDateTime(value),
          },
          {
            title: 'Pago',
            dataIndex: 'paymentDate',
            key: 'paymentDate',
            render: (value: null | string | undefined) => formatDateTime(value),
          },
          {
            title: 'Acciones',
            key: 'actions',
            width: 80,
            render: (_, row: OrderEntity) => (
              <Space size={0}>
                <Tooltip title="Ver productos">
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    aria-label="Ver productos de la orden"
                    onClick={() => setProductsModal({ open: true, order: row })}
                  />
                </Tooltip>
              </Space>
            ),
          },
        ]}
      />
      <OrderProductsModal
        open={productsModal.open}
        order={productsModal.order}
        onClose={() => setProductsModal({ open: false, order: null })}
      />
    </section>
  );
};

export default MyOrdersPage;
