import { EyeOutlined } from '@ant-design/icons';
import { Alert, Button, Image, message, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import type { OrderEntity, OrderStatus } from '../../types/order';

import { getKitchenOrders, patchAdminOrderStatus, verifyPayment } from '../../api/orders';
import { connectSocket, disconnectSocket, getSocket } from '../../realtime/socket';

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

const AdminOrdersPage = () => {
  const [data, setData] = useState<OrderEntity[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    order: OrderEntity | null;
  }>({ open: false, order: null });
  const [verifying, setVerifying] = useState(false);
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
      { label: 'Preparando', value: 'preparing' },
      { label: 'Lista para reparto', value: 'readyForDelivery' },
      { label: 'Cancelar', value: 'cancelled' },
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

  const handleVerifyPayment = async (orderId: string) => {
    setVerifying(true);
    const result = await verifyPayment(orderId, true);
    setVerifying(false);
    if (!result.ok || !result.data?.order) {
      void message.error(
        (result.data as { error?: string })?.error ?? 'No se pudo verificar el pago'
      );
      return;
    }
    void message.success('Pago verificado');
    setPaymentModal({ open: false, order: null });
    void reload();
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('es-VE');
  };

  const formatMethod = (method: string | null | undefined) => {
    if (!method) return '—';
    const map: Record<string, string> = {
      cash: 'Efectivo',
      zelle: 'Zelle',
      mobilePayment: 'Pago Móvil',
      binance: 'Binance',
    };
    return map[method] ?? method;
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
            { title: 'Orden', dataIndex: 'id', key: 'id', width: 220 },
            { title: 'Cédula', dataIndex: 'userNumberId', key: 'userNumberId', width: 100 },
            {
              title: 'Estado',
              dataIndex: 'status',
              key: 'status',
              width: 130,
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
                return (
                  <Tag color={statusColor[status] ?? 'default'}>{labels[status] ?? status}</Tag>
                );
              },
            },
            {
              title: 'Total',
              dataIndex: 'totalAmount',
              key: 'totalAmount',
              width: 120,
              render: (value: number) =>
                `REF ${value.toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
            },
            {
              title: 'Dirección de envío',
              dataIndex: 'deliveryAddress',
              key: 'deliveryAddress',
              width: 200,
              render: (value: string | null) => value ?? '—',
            },
            {
              title: 'Creación',
              dataIndex: 'createdAt',
              key: 'createdAt',
              width: 150,
              render: (value: string) => new Date(value).toLocaleString(),
            },
            {
              title: 'Acciones',
              key: 'actions',
              width: 280,
              render: (_, row: OrderEntity) => (
                <Space>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => setPaymentModal({ open: true, order: row })}
                  >
                    Pago
                  </Button>
                  <Select
                    placeholder="Cambiar estado"
                    style={{ minWidth: 150 }}
                    options={statusOptions}
                    onChange={(value) => {
                      void patchStatus(row.id, value as OrderStatus);
                    }}
                  />
                  <Button danger onClick={() => void patchStatus(row.id, 'cancelled')}>
                    Cancelar
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Space>

      <Modal
        title="Detalles del pago"
        open={paymentModal.open}
        onCancel={() => setPaymentModal({ open: false, order: null })}
        footer={[
          <Button key="cancel" onClick={() => setPaymentModal({ open: false, order: null })}>
            Cerrar
          </Button>,
          paymentModal.order?.status === 'pending' && paymentModal.order?.paymentScreenshotUrl ? (
            <Button
              key="verify"
              type="primary"
              loading={verifying}
              onClick={() => {
                if (paymentModal.order) {
                  void handleVerifyPayment(paymentModal.order.id);
                }
              }}
            >
              Verificar pago
            </Button>
          ) : null,
        ].filter(Boolean)}
      >
        {paymentModal.order ? (
          <Space direction="vertical" size={12} className="w-full">
            <p>
              <strong>Método:</strong> {formatMethod(paymentModal.order.paymentMethod)}
            </p>
            <p>
              <strong>Referencia:</strong> {paymentModal.order.paymentReference ?? '—'}
            </p>
            <p>
              <strong>Fecha de pago:</strong> {formatDate(paymentModal.order.paymentDate)}
            </p>
            <p>
              <strong>Estado del pago:</strong>{' '}
              {paymentModal.order.payment?.verifiedAt ? (
                <Tag color="green">
                  Verificado el {formatDate(paymentModal.order.payment?.verifiedAt)}
                </Tag>
              ) : (
                <Tag color="orange">Pendiente verificación</Tag>
              )}
            </p>
            <p>
              <strong>Dirección de envío:</strong> {paymentModal.order.deliveryAddress ?? '—'}
            </p>
            {paymentModal.order.paymentScreenshotUrl ? (
              <div>
                <strong>Comprobante:</strong>
                <div className="mt-2">
                  <Image
                    src={paymentModal.order.paymentScreenshotUrl}
                    alt="Comprobante de pago"
                    style={{ maxWidth: 300, cursor: 'pointer' }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                  />
                </div>
              </div>
            ) : (
              <p>
                <strong>Comprobante:</strong> —
              </p>
            )}
          </Space>
        ) : null}
      </Modal>
    </section>
  );
};

export default AdminOrdersPage;
