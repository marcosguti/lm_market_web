import { Alert, Button, Card, Col, message, Row, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';

import type { OrderEntity } from '../../types/order';

import {
  claimDeliveryOrder,
  getDeliveryAvailable,
  getDeliveryMine,
  markDelivered,
} from '../../api/orders';

const { Title } = Typography;

const statusColor: Record<string, string> = {
  cancelled: 'red',
  outForDelivery: 'blue',
  delivered: 'green',
  readyForDelivery: 'cyan',
  paymentConfirmed: 'gold',
  pending: 'orange',
  preparing: 'purple',
};

const DeliveryOrdersPage = () => {
  const [available, setAvailable] = useState<OrderEntity[]>([]);
  const [mine, setMine] = useState<OrderEntity[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    setLoading(true);
    const [availableRes, mineRes] = await Promise.all([
      getDeliveryAvailable(1, 100),
      getDeliveryMine(1, 100),
    ]);
    setLoading(false);

    if (!availableRes.ok || !mineRes.ok || !availableRes.data?.data || !mineRes.data?.data) {
      setError('No se pudieron cargar las ordenes de reparto');
      return;
    }
    setAvailable(availableRes.data.data);
    setMine(mineRes.data.data);
    setError('');
  };

  useEffect(() => {
    queueMicrotask(() => {
      void reload();
    });
  }, []);

  const claimOrder = async (orderId: string) => {
    const result = await claimDeliveryOrder(orderId);
    if (!result.ok) {
      void message.error((result.data as { error?: string })?.error ?? 'No se pudo tomar la orden');
      return;
    }
    void message.success('Orden tomada');
    void reload();
  };

  const completeOrder = async (orderId: string) => {
    const result = await markDelivered(orderId);
    if (!result.ok) {
      void message.error(
        (result.data as { error?: string })?.error ?? 'No se pudo marcar entregada'
      );
      return;
    }
    void message.success('Orden entregada');
    void reload();
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Space direction="vertical" size={16} className="w-full">
        <Title level={2} className="!mb-0">
          Panel de reparto
        </Title>
        {error ? <Alert type="error" showIcon message={error} /> : null}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Disponibles para tomar">
              <Table
                rowKey="id"
                loading={loading}
                pagination={false}
                dataSource={available}
                columns={[
                  { title: 'Orden', dataIndex: 'id', key: 'id' },
                  {
                    title: 'Estado',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: string) => {
                      const labels: Record<string, string> = {
                        pending: 'Pendiente',
                        paymentConfirmed: 'Pago Confirmado',
                        preparing: 'Preparando',
                        readyForDelivery: 'Lista para Reparto',
                        outForDelivery: 'En Reparto',
                        delivered: 'Entregada',
                        cancelled: 'Cancelada',
                      };
                      return <Tag color={statusColor[status] ?? 'default'}>{labels[status] ?? status}</Tag>;
                    },
                  },
                  {
                    title: 'Acción',
                    key: 'action',
                    render: (_, row: OrderEntity) => (
                      <Button type="primary" size="small" onClick={() => void claimOrder(row.id)}>
                        Tomar
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Mis entregas en ruta">
              <Table
                rowKey="id"
                loading={loading}
                pagination={false}
                dataSource={mine}
                columns={[
                  { title: 'Orden', dataIndex: 'id', key: 'id' },
                  {
                    title: 'Estado',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: string) => {
                      const labels: Record<string, string> = {
                        pending: 'Pendiente',
                        paymentConfirmed: 'Pago Confirmado',
                        preparing: 'Preparando',
                        readyForDelivery: 'Lista para Reparto',
                        outForDelivery: 'En Reparto',
                        delivered: 'Entregada',
                        cancelled: 'Cancelada',
                      };
                      return <Tag color={statusColor[status] ?? 'default'}>{labels[status] ?? status}</Tag>;
                    },
                  },
                  {
                    title: 'Acción',
                    key: 'action',
                    render: (_, row: OrderEntity) => (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => void completeOrder(row.id)}
                      >
                        Marcar entregada
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </Space>
    </section>
  );
};

export default DeliveryOrdersPage;
