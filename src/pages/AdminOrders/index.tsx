import type { UploadFile } from 'antd/es/upload/interface';

import {
  CarOutlined,
  CheckOutlined,
  CloseOutlined,
  CreditCardOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  UndoOutlined,
  UnorderedListOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Image,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import type { OrderEntity, OrderStatus } from '../../types/order';

import { type AdminUser, getAdminUsers } from '../../api/adminUsers';
import {
  assignDelivery,
  getKitchenOrders,
  markDelivered,
  patchAdminOrderStatus,
  startDelivery,
  unassignDelivery,
  verifyPayment,
} from '../../api/orders';
import { getStores, type Store } from '../../api/stores';
import { OrderProductsModal } from '../../components/OrderProductsModal';
import { OrderStatusHistoryModal } from '../../components/OrderStatusHistoryModal';
import { ShortOrderId } from '../../components/ShortOrderId';
import { formatOrderTotalBs } from '../../constants/pricing';
import { useUsdRate } from '../../context/ExchangeRateContext';
import { connectSocket, disconnectSocket, getSocket } from '../../realtime/socket';
import { formatDateTime } from '../../utils/formatDate';
import { formatShortOrderId } from '../../utils/orderId';
import {
  ORDER_PERIOD_OPTIONS,
  type OrderPeriodFilter,
  resolveOrderPeriodDates,
} from '../../utils/orderPeriodFilter';
import { canCancelOrder, ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from '../../utils/orderStatus';

const { Title, Text } = Typography;

const ALL_FILTER = 'all';

function FilterField({
  children,
  label,
  testId,
}: {
  children: ReactNode;
  label: string;
  testId: string;
}) {
  return (
    <div className="flex flex-col gap-1" data-testid={testId}>
      <Text className="text-sm text-gray-500">{label}</Text>
      {children}
    </div>
  );
}

function renderPaymentStatus(order: OrderEntity) {
  if (order.status === 'paymentPendingConfirmation') {
    return <Tag color="orange">Pago por confirmar</Tag>;
  }

  if (order.status === 'pending') {
    return <Tag>Sin comprobante</Tag>;
  }

  if (order.payment?.verifiedAutomatically) {
    return <Tag color="green">Verificado automáticamente (P2C)</Tag>;
  }

  if (order.payment?.verifiedAt) {
    return <Tag color="green">Verificado el {formatDateTime(order.payment.verifiedAt)}</Tag>;
  }

  return <Tag color="green">Pago confirmado</Tag>;
}

const statusColor: Record<string, string> = {
  assignedToDeliveryDriver: 'geekblue',
  cancelled: 'red',
  delivered: 'green',
  delivering: 'blue',
  paymentConfirmed: 'gold',
  paymentPendingConfirmation: 'orange',
  pending: 'default',
  preparing: 'purple',
  readyForDelivery: 'cyan',
};

const AdminOrdersPage = () => {
  const usdRate = useUsdRate();
  const [data, setData] = useState<OrderEntity[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [drivers, setDrivers] = useState<AdminUser[]>([]);
  const [orderIdInput, setOrderIdInput] = useState('');
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | typeof ALL_FILTER>(ALL_FILTER);
  const [periodFilter, setPeriodFilter] = useState<OrderPeriodFilter>('today');
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    order: OrderEntity | null;
  }>({ open: false, order: null });
  const [productsModal, setProductsModal] = useState<{
    open: boolean;
    order: OrderEntity | null;
  }>({ open: false, order: null });
  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    orderId: null | string;
  }>({ open: false, orderId: null });
  const [assignModal, setAssignModal] = useState<{
    open: boolean;
    order: OrderEntity | null;
  }>({ open: false, order: null });
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [deliverModal, setDeliverModal] = useState<{
    open: boolean;
    order: OrderEntity | null;
  }>({ open: false, order: null });
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    order: OrderEntity | null;
  }>({ open: false, order: null });
  const [cancellationReason, setCancellationReason] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem('lm_market_token');

  const statusOptions = useMemo(
    () => [
      { label: 'Todos', value: ALL_FILTER },
      ...ORDER_STATUS_FLOW.filter((value) => value !== 'pending').map((value) => ({
        label: ORDER_STATUS_LABELS[value],
        value,
      })),
    ],
    []
  );

  const storeOptions = useMemo(
    () => [
      { label: 'Todos', value: ALL_FILTER },
      ...stores.map((store) => ({ label: store.name, value: store.id })),
    ],
    [stores]
  );

  const driverOptions = useMemo(
    () =>
      drivers.map((driver) => ({
        label: `${driver.firstName} ${driver.lastName} (${driver.email})`,
        value: driver.id,
      })),
    [drivers]
  );

  const reload = useCallback(async () => {
    setLoading(true);
    const periodDates = resolveOrderPeriodDates(periodFilter);
    const result = await getKitchenOrders(1, 100, {
      ...periodDates,
      id: orderIdFilter || undefined,
      status: statusFilter,
      storeId: storeFilter,
    });
    setLoading(false);
    if (!result.ok || !result.data?.data) {
      setError((result.data as { error?: string })?.error ?? 'No se pudo cargar la cola de cocina');
      return;
    }
    setData(result.data.data);
    setError('');
  }, [orderIdFilter, periodFilter, statusFilter, storeFilter]);

  useEffect(() => {
    void (async () => {
      const loadedStores = await getStores();
      setStores(loadedStores);
      const usersRes = await getAdminUsers(1, 100);
      if (usersRes.ok && usersRes.data?.data) {
        setDrivers(usersRes.data.data.filter((user) => user.type === 'deliveryDriver'));
      }
    })();
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void reload();
    });
  }, [reload]);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);
    const onReload = () => {
      void reload();
    };
    socket.on('order:newPaid', onReload);
    socket.on('order:cancelled', onReload);
    socket.on('order:updated', onReload);
    return () => {
      socket.off('order:newPaid', onReload);
      socket.off('order:cancelled', onReload);
      socket.off('order:updated', onReload);
      if (getSocket()) disconnectSocket();
    };
  }, [reload, token]);

  const getStatusOptions = (order: OrderEntity): { label: string; value: OrderStatus }[] => {
    if (order.status === 'paymentConfirmed') {
      return [{ label: 'Preparando', value: 'preparing' }];
    }
    if (order.status === 'preparing') {
      return [{ label: 'Lista para reparto', value: 'readyForDelivery' }];
    }
    return [];
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

  const confirmCancelOrder = (order: OrderEntity) => {
    setCancellationReason('');
    setCancelModal({ open: true, order });
  };

  const handleCancelOrder = async () => {
    if (!cancelModal.order) return;
    const reason = cancellationReason.trim();
    if (reason.length < 3) {
      void message.error('Indica un motivo de cancelación (mínimo 3 caracteres)');
      return;
    }
    setSubmitting(true);
    const result = await patchAdminOrderStatus(cancelModal.order.id, 'cancelled', reason);
    setSubmitting(false);
    if (!result.ok || !result.data?.order) {
      void message.error(
        (result.data as { error?: string })?.error ?? 'No se pudo cancelar la orden'
      );
      return;
    }
    void message.success('Orden cancelada');
    setCancelModal({ open: false, order: null });
    setCancellationReason('');
    void reload();
  };

  const handleAssign = async () => {
    if (!assignModal.order || !selectedDriverId) {
      void message.error('Debes seleccionar un repartidor');
      return;
    }
    setSubmitting(true);
    const result = await assignDelivery(assignModal.order.id, selectedDriverId);
    setSubmitting(false);
    if (!result.ok) {
      void message.error(
        (result.data as { error?: string })?.error ?? 'No se pudo asignar el repartidor'
      );
      return;
    }
    void message.success('Repartidor asignado');
    setAssignModal({ open: false, order: null });
    setSelectedDriverId(null);
    void reload();
  };

  const handleUnassign = (order: OrderEntity) => {
    Modal.confirm({
      title: '¿Rechazar asignación?',
      content: 'La orden volverá a lista para reparto y se podrá asignar a otro repartidor.',
      okText: 'Sí, rechazar',
      cancelText: 'No',
      okButtonProps: { danger: true },
      onOk: async () => {
        const result = await unassignDelivery(order.id);
        if (!result.ok) {
          void message.error(
            (result.data as { error?: string })?.error ?? 'No se pudo rechazar la asignación'
          );
          return;
        }
        void message.success('Asignación rechazada');
        void reload();
      },
    });
  };

  const handleStart = async (orderId: string) => {
    const result = await startDelivery(orderId);
    if (!result.ok) {
      void message.error(
        (result.data as { error?: string })?.error ?? 'No se pudo iniciar el reparto'
      );
      return;
    }
    void message.success('Reparto iniciado');
    void reload();
  };

  const handleDeliver = async () => {
    if (!deliverModal.order || !proofFile) {
      void message.error('Debes seleccionar una foto de entrega');
      return;
    }
    setSubmitting(true);
    const result = await markDelivered(deliverModal.order.id, proofFile);
    setSubmitting(false);
    if (!result.ok) {
      void message.error(
        (result.data as { error?: string })?.error ?? 'No se pudo marcar entregada'
      );
      return;
    }
    void message.success('Orden entregada');
    setDeliverModal({ open: false, order: null });
    setProofFile(null);
    setFileList([]);
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
        <Space wrap align="end">
          <FilterField label="Order ID" testId="filter-order-id">
            <Input.Search
              allowClear
              enterButton="Buscar"
              placeholder="Buscar por ID"
              style={{ width: 260 }}
              value={orderIdInput}
              onChange={(event) => setOrderIdInput(event.target.value)}
              onSearch={(value) => {
                setOrderIdFilter(value.trim());
              }}
            />
          </FilterField>
          <FilterField label="Sede" testId="filter-store">
            <Select
              options={storeOptions}
              style={{ width: 180 }}
              value={storeFilter}
              onChange={(value) => {
                setStoreFilter(value);
              }}
            />
          </FilterField>
          <FilterField label="Estado" testId="filter-status">
            <Select
              listHeight={360}
              options={statusOptions}
              style={{ width: 220 }}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
              }}
            />
          </FilterField>
          <FilterField label="Período" testId="filter-period">
            <Select
              options={ORDER_PERIOD_OPTIONS}
              style={{ width: 200 }}
              value={periodFilter}
              onChange={(value) => {
                setPeriodFilter(value);
              }}
            />
          </FilterField>
        </Space>
        {error ? <Alert type="error" showIcon message={error} /> : null}
        <Table
          loading={loading}
          rowKey="id"
          dataSource={data}
          columns={[
            {
              title: 'Orden',
              dataIndex: 'id',
              key: 'id',
              width: 110,
              render: (id: string) => <ShortOrderId id={id} />,
            },
            { title: 'Cédula', dataIndex: 'userNumberId', key: 'userNumberId', width: 100 },
            {
              title: 'Estado',
              dataIndex: 'status',
              key: 'status',
              width: 180,
              render: (status: string, row: OrderEntity) => {
                const showDriver =
                  Boolean(row.deliveryUserName) &&
                  (status === 'delivering' || status === 'assignedToDeliveryDriver');
                return (
                  <span className="inline-flex items-center gap-1">
                    <Tag color={statusColor[status] ?? 'default'}>
                      {ORDER_STATUS_LABELS[status as OrderStatus] ?? status}
                    </Tag>
                    {showDriver ? (
                      <Tooltip
                        title={
                          <>
                            <div>Repartidor: {row.deliveryUserName}</div>
                            <div>{row.deliveryUserPhone?.trim() || 'Sin teléfono'}</div>
                          </>
                        }
                      >
                        <CarOutlined
                          className="cursor-pointer text-gray-500"
                          aria-label={`Repartidor: ${row.deliveryUserName}`}
                        />
                      </Tooltip>
                    ) : null}
                  </span>
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
              render: (_value: number, row: OrderEntity) =>
                `Bs ${formatOrderTotalBs(row, usdRate)}`,
            },
            {
              title: 'Datos de envío',
              key: 'deliveryContact',
              width: 200,
              render: (_: unknown, row: OrderEntity) => {
                const address = row.deliveryAddress?.trim();
                const phone = row.deliveryPhone?.trim();
                if (!address && !phone) return '—';
                return (
                  <div className="min-w-0 max-w-[180px]">
                    {address ? (
                      <Tooltip title={address}>
                        <span className="block cursor-pointer truncate">{address}</span>
                      </Tooltip>
                    ) : (
                      <span>—</span>
                    )}
                    {phone ? (
                      <Text type="secondary" className="!mb-0 block text-xs">
                        {phone}
                      </Text>
                    ) : null}
                  </div>
                );
              },
            },
            {
              title: 'Creación',
              dataIndex: 'createdAt',
              key: 'createdAt',
              width: 150,
              render: (value: string) => formatDateTime(value),
            },
            {
              title: 'Acciones',
              key: 'actions',
              width: 280,
              render: (_, row: OrderEntity) => {
                const statusOptions = getStatusOptions(row);
                return (
                  <Space size={0} wrap>
                    <Tooltip title="Ver productos">
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        aria-label="Ver productos de la orden"
                        onClick={() => setProductsModal({ open: true, order: row })}
                      />
                    </Tooltip>
                    <Tooltip title="Historial de estados">
                      <Button
                        type="text"
                        size="small"
                        icon={<UnorderedListOutlined />}
                        aria-label="Historial de estados"
                        onClick={() => setHistoryModal({ open: true, orderId: row.id })}
                      />
                    </Tooltip>
                    <Tooltip title="Detalles del pago">
                      <Button
                        type="text"
                        size="small"
                        icon={<CreditCardOutlined />}
                        aria-label="Detalles del pago"
                        onClick={() => setPaymentModal({ open: true, order: row })}
                      />
                    </Tooltip>
                    {statusOptions.length > 0 ? (
                      <Select
                        size="small"
                        placeholder="Estado"
                        style={{ minWidth: 120 }}
                        options={statusOptions}
                        onChange={(value) => {
                          void patchStatus(row.id, value as OrderStatus);
                        }}
                      />
                    ) : null}
                    {row.status === 'readyForDelivery' ? (
                      <Tooltip title="Asignar repartidor">
                        <Button
                          type="text"
                          size="small"
                          icon={<UserAddOutlined />}
                          aria-label="Asignar repartidor"
                          onClick={() => {
                            setSelectedDriverId(null);
                            setAssignModal({ open: true, order: row });
                          }}
                        />
                      </Tooltip>
                    ) : null}
                    {row.status === 'assignedToDeliveryDriver' ? (
                      <>
                        <Tooltip title="Iniciar reparto">
                          <Button
                            type="text"
                            size="small"
                            icon={<PlayCircleOutlined />}
                            aria-label="Iniciar reparto"
                            onClick={() => void handleStart(row.id)}
                          />
                        </Tooltip>
                        <Tooltip title="Rechazar asignación">
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<UndoOutlined />}
                            aria-label="Rechazar asignación"
                            onClick={() => handleUnassign(row)}
                          />
                        </Tooltip>
                      </>
                    ) : null}
                    {row.status === 'delivering' ? (
                      <Tooltip title="Marcar entregada">
                        <Button
                          type="text"
                          size="small"
                          icon={<CheckOutlined />}
                          aria-label="Marcar entregada"
                          onClick={() => {
                            setProofFile(null);
                            setFileList([]);
                            setDeliverModal({ open: true, order: row });
                          }}
                        />
                      </Tooltip>
                    ) : null}
                    {canCancelOrder(row.status) ? (
                      <Tooltip title="Cancelar orden">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<CloseOutlined />}
                          aria-label="Cancelar orden"
                          onClick={() => confirmCancelOrder(row)}
                        />
                      </Tooltip>
                    ) : null}
                  </Space>
                );
              },
            },
          ]}
        />
      </Space>

      <OrderProductsModal
        open={productsModal.open}
        order={productsModal.order}
        onClose={() => setProductsModal({ open: false, order: null })}
      />

      <OrderStatusHistoryModal
        open={historyModal.open}
        orderId={historyModal.orderId}
        onClose={() => setHistoryModal({ open: false, orderId: null })}
      />

      <Modal
        title="Asignar repartidor"
        open={assignModal.open}
        onCancel={() => setAssignModal({ open: false, order: null })}
        onOk={() => void handleAssign()}
        okText="Asignar"
        confirmLoading={submitting}
        okButtonProps={{ disabled: !selectedDriverId }}
      >
        <Select
          className="w-full"
          placeholder="Selecciona un repartidor"
          options={driverOptions}
          value={selectedDriverId}
          onChange={setSelectedDriverId}
          showSearch
          optionFilterProp="label"
        />
      </Modal>

      <Modal
        title={
          cancelModal.order
            ? `Cancelar orden ${formatShortOrderId(cancelModal.order.id)}`
            : 'Cancelar orden'
        }
        open={cancelModal.open}
        onCancel={() => {
          setCancelModal({ open: false, order: null });
          setCancellationReason('');
        }}
        footer={[
          <Button
            key="no"
            onClick={() => {
              setCancelModal({ open: false, order: null });
              setCancellationReason('');
            }}
          >
            No
          </Button>,
          <Button
            key="ok"
            danger
            type="primary"
            loading={submitting}
            disabled={cancellationReason.trim().length < 3}
            onClick={() => void handleCancelOrder()}
          >
            Cancelar orden
          </Button>,
        ]}
      >
        <p className="mb-3 text-sm text-gray-600">
          Esta acción no se puede deshacer. Indica el motivo que se enviará al cliente por correo.
        </p>
        <Input.TextArea
          rows={4}
          maxLength={500}
          showCount
          placeholder="Motivo de cancelación"
          value={cancellationReason}
          onChange={(event) => setCancellationReason(event.target.value)}
        />
      </Modal>

      <Modal
        title="Foto de entrega"
        open={deliverModal.open}
        onCancel={() => setDeliverModal({ open: false, order: null })}
        onOk={() => void handleDeliver()}
        okText="Confirmar entrega"
        confirmLoading={submitting}
        okButtonProps={{ disabled: !proofFile }}
      >
        <Upload
          accept="image/jpeg,image/png,image/webp"
          beforeUpload={(file) => {
            setProofFile(file);
            setFileList([
              {
                uid: file.uid,
                name: file.name,
                status: 'done',
              },
            ]);
            return false;
          }}
          fileList={fileList}
          maxCount={1}
          onRemove={() => {
            setProofFile(null);
            setFileList([]);
          }}
        >
          <Button>Seleccionar foto</Button>
        </Upload>
      </Modal>

      <Modal
        title="Detalles del pago"
        open={paymentModal.open}
        onCancel={() => setPaymentModal({ open: false, order: null })}
        footer={[
          <Button key="cancel" onClick={() => setPaymentModal({ open: false, order: null })}>
            Cerrar
          </Button>,
          paymentModal.order?.status === 'paymentPendingConfirmation' &&
          paymentModal.order?.paymentScreenshotUrl ? (
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
              <strong>Fecha de pago:</strong> {formatDateTime(paymentModal.order.paymentDate)}
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
