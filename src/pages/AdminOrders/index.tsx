import { CreditCardOutlined, EyeOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Image,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';

import type { OrderEntity, OrderStatus } from '../../types/order';

import { getKitchenOrders, patchAdminOrderStatus, verifyPayment } from '../../api/orders';
import { OrderProductsModal } from '../../components/OrderProductsModal';
import { connectSocket, disconnectSocket, getSocket } from '../../realtime/socket';
import { canCancelOrder } from '../../utils/orderStatus';

const { Title } = Typography;

function formatOrderDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('es-VE');
}

function renderPaymentStatus(order: OrderEntity) {
  if (order.status === 'pending') {
    if (order.paymentScreenshotUrl) {
      return <Tag color="orange">Pendiente verificación</Tag>;
    }
    return <Tag>Sin comprobante</Tag>;
  }

  if (order.payment?.verifiedAutomatically) {
    return <Tag color="green">Verificado automáticamente (P2C)</Tag>;
  }

  if (order.payment?.verifiedAt) {
    return <Tag color="green">Verificado el {formatOrderDate(order.payment.verifiedAt)}</Tag>;
  }

  return <Tag color="green">Pago confirmado</Tag>;
}

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
  const [productsModal, setProductsModal] = useState<{
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

  const getStatusOptions = (order: OrderEntity): { label: string; value: OrderStatus }[] => {
    if (order.status === 'paymentConfirmed') {
      return [{ label: 'Preparando', value: 'preparing' }];
    }
    if (order.status === 'preparing') {
      return [{ label: 'Lista para reparto', value: 'readyForDelivery' }];
    }
    if (order.status === 'outForDelivery') {
      return [{ label: 'Entregado', value: 'delivered' }];
    }
    return [];
  };

  const handleCancelOrder = (order: OrderEntity) => {
    Modal.confirm({
      title: '¿Cancelar esta orden?',
      content: 'Esta acción no se puede deshacer. La orden quedará cancelada.',
      okText: 'Sí, cancelar',
      cancelText: 'No',
      okButtonProps: { danger: true },
      onOk: () => patchStatus(order.id, 'cancelled'),
    });
  };

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

  const formatDate = formatOrderDate;

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
          Órdenes de compra
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
              title: 'Sede',
              dataIndex: 'storeName',
              key: 'storeName',
              width: 140,
              render: (value: string | null | undefined) => value?.trim() || '—',
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
                  <Tooltip title="Ver productos">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      aria-label="Ver productos de la orden"
                      onClick={() => setProductsModal({ open: true, order: row })}
                    />
                  </Tooltip>
                  <Button
                    icon={<CreditCardOutlined />}
                    onClick={() => setPaymentModal({ open: true, order: row })}
                  >
                    Pago
                  </Button>
                  <Select
                    disabled={getStatusOptions(row).length === 0}
                    placeholder="Cambiar estado"
                    style={{ minWidth: 150 }}
                    options={getStatusOptions(row)}
                    onChange={(value) => {
                      void patchStatus(row.id, value as OrderStatus);
                    }}
                  />
                  {canCancelOrder(row.status) ? (
                    <Button danger onClick={() => handleCancelOrder(row)}>
                      Cancelar
                    </Button>
                  ) : null}
                </Space>
              ),
            },
          ]}
        />
      </Space>

      <OrderProductsModal
        open={productsModal.open}
        order={productsModal.order}
        onClose={() => setProductsModal({ open: false, order: null })}
      />

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
              <strong>Estado del pago:</strong> {renderPaymentStatus(paymentModal.order)}
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
