import { Alert, Button, message, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import type { OrderEntity, OrderStatus } from '../../types/order';

import { getKitchenOrders, patchAdminOrderStatus } from '../../api/orders';
import { connectSocket, disconnectSocket, getSocket } from '../../realtime/socket';

const { Title } = Typography;

const statusColor: Record<string, string> = {
  cancelada: 'red',
  enReparto: 'blue',
  entregada: 'green',
  listaParaReparto: 'cyan',
  pagoConfirmado: 'gold',
  pendiente: 'orange',
  preparando: 'purple',
};

const AdminOrdersPage = () => {
  const [data, setData] = useState<OrderEntity[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('lm_market_token');

  const reload = async () => {
    setLoading(true);
    const result = await getKitchenOrders(1, 100);
    setLoading(false);
    if (!result.ok || !result.data?.data) {
      setError((result.data as { error?: string })?.error ?? 'No se pudo cargar la cola de cocina');
      return;
    }
    setData(result.data.data);
    setError('');
  };

  useEffect(() => {
    queueMicrotask(() => {
      void reload();
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);
    const onNewPaid = () => {
      void reload();
    };
    const onCancelled = () => {
      void reload();
    };
    socket.on('order:newPaid', onNewPaid);
    socket.on('order:cancelled', onCancelled);
    return () => {
      socket.off('order:newPaid', onNewPaid);
      socket.off('order:cancelled', onCancelled);
      if (getSocket()) disconnectSocket();
    };
  }, [token]);

  const statusOptions = useMemo(
    () => [
      { label: 'Preparando', value: 'preparando' },
      { label: 'Lista para reparto', value: 'listaParaReparto' },
      { label: 'Cancelar', value: 'cancelada' },
    ],
    []
  );

  const patchStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const result = await patchAdminOrderStatus(orderId, nextStatus);
    if (!result.ok || !result.data?.order) {
      void message.error(
        (result.data as { error?: string })?.error ?? 'No se pudo actualizar el estado'
      );
      return;
    }
    void message.success('Estado actualizado');
    void reload();
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Space direction="vertical" size={16} className="w-full">
        <Title level={2} className="!mb-0">
          Ordenes de compra
        </Title>
        {error ? <Alert type="error" showIcon message={error} /> : null}
        <Table
          loading={loading}
          rowKey="id"
          dataSource={data}
          columns={[
            { title: 'Orden', dataIndex: 'id', key: 'id' },
            { title: 'Cédula', dataIndex: 'userNumberId', key: 'userNumberId' },
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
              title: 'Creación',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (value: string) => new Date(value).toLocaleString(),
            },
            {
              title: 'Actualización',
              dataIndex: 'updatedAt',
              key: 'updatedAt',
              render: (value: string) => new Date(value).toLocaleString(),
            },
            {
              title: 'Acciones',
              key: 'actions',
              render: (_, row: OrderEntity) => (
                <Space>
                  <Select
                    placeholder="Cambiar estado"
                    style={{ minWidth: 180 }}
                    options={statusOptions}
                    onChange={(value) => {
                      void patchStatus(row.id, value as OrderStatus);
                    }}
                  />
                  <Button danger onClick={() => void patchStatus(row.id, 'cancelada')}>
                    Cancelar
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Space>
    </section>
  );
};

export default AdminOrdersPage;
