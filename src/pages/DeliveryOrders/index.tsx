import type { UploadFile } from 'antd/es/upload/interface';

import {
  Alert,
  Button,
  Card,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';

import type { OrderEntity } from '../../types/order';

import { getDeliveryMine, markDelivered, startDelivery } from '../../api/orders';
import { ShortOrderId } from '../../components/ShortOrderId';
import { connectSocket, disconnectSocket, getSocket } from '../../realtime/socket';
import { ORDER_STATUS_LABELS } from '../../utils/orderStatus';

const { Text, Title } = Typography;

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

const DeliveryOrdersPage = () => {
  const [mine, setMine] = useState<OrderEntity[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deliverModal, setDeliverModal] = useState<{ open: boolean; order: OrderEntity | null }>({
    open: false,
    order: null,
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem('lm_market_token');

  const reload = useCallback(async () => {
    setLoading(true);
    const mineRes = await getDeliveryMine(1, 100);
    setLoading(false);

    if (!mineRes.ok || !mineRes.data?.data) {
      setError('No se pudieron cargar las ordenes de reparto');
      return;
    }
    setMine(mineRes.data.data);
    setError('');
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
    socket.on('order:updated', onReload);
    socket.on('order:cancelled', onReload);
    return () => {
      socket.off('order:updated', onReload);
      socket.off('order:cancelled', onReload);
      if (getSocket()) disconnectSocket();
    };
  }, [reload, token]);

  const startOrder = async (orderId: string) => {
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

  const completeOrder = async () => {
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

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Space direction="vertical" size={16} className="w-full">
        <Title level={2} className="!mb-0">
          Panel de reparto
        </Title>
        {error ? <Alert type="error" showIcon message={error} /> : null}
        <Card title="Mis entregas asignadas">
          <Table
            rowKey="id"
            loading={loading}
            pagination={false}
            dataSource={mine}
            columns={[
              {
                title: 'Orden',
                dataIndex: 'id',
                key: 'id',
                width: 110,
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
                title: 'Datos de envío',
                key: 'deliveryContact',
                width: 220,
                render: (_: unknown, row: OrderEntity) => {
                  const address = row.deliveryAddress?.trim();
                  const phone = row.deliveryPhone?.trim();
                  if (!address && !phone) return '—';
                  return (
                    <div className="min-w-0 max-w-[200px]">
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
                title: 'Acción',
                key: 'action',
                render: (_, row: OrderEntity) => (
                  <Space>
                    {row.status === 'assignedToDeliveryDriver' ? (
                      <Button type="primary" size="small" onClick={() => void startOrder(row.id)}>
                        Iniciar reparto
                      </Button>
                    ) : null}
                    {row.status === 'delivering' ? (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          setProofFile(null);
                          setFileList([]);
                          setDeliverModal({ open: true, order: row });
                        }}
                      >
                        Marcar entregada
                      </Button>
                    ) : null}
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      </Space>

      <Modal
        title="Foto de entrega"
        open={deliverModal.open}
        onCancel={() => setDeliverModal({ open: false, order: null })}
        onOk={() => void completeOrder()}
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
    </section>
  );
};

export default DeliveryOrdersPage;
