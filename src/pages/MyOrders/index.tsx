import { Alert, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';

import type { OrderEntity } from '../../types/order';

import { getOrderHistory } from '../../api/orders';
import { connectSocket } from '../../realtime/socket';

const { Title } = Typography;

const TOKEN_KEY = 'lm_market_token';

const statusColor: Record<string, string> = {
  cancelada: 'red',
  enReparto: 'blue',
  entregada: 'green',
  listaParaReparto: 'cyan',
  pagoConfirmado: 'gold',
  pendiente: 'orange',
  preparando: 'purple',
};

interface OrderUpdatedPayload {
  id: string;
  status: string;
  totalAmount: number;
}

const MyOrdersPage = () => {
  const [data, setData] = useState<OrderEntity[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      setData((prev) =>
        prev.map((order) =>
          order.id === payload.id
            ? { ...order, status: payload.status as OrderEntity['status'] }
            : order
        )
      );
    };

    socket.on('order:updated', onOrderUpdated);

    return () => {
      socket.off('order:updated', onOrderUpdated);
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Title level={2}>Mis compras</Title>
      {error ? <Alert type="error" showIcon message={error} className="mb-4" /> : null}
      <Table
        loading={loading}
        rowKey="id"
        dataSource={data}
        columns={[
          { title: 'Orden', dataIndex: 'id', key: 'id' },
          {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
              <Tag color={statusColor[status] ?? 'default'}>{status}</Tag>
            ),
          },
          {
            title: 'Total',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (value: number) =>
              `REF ${value.toLocaleString('es-VE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
          },
          {
            title: 'Fecha',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (value: string) => new Date(value).toLocaleString(),
          },
        ]}
      />
    </section>
  );
};

export default MyOrdersPage;
