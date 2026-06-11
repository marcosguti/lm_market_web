import type { Dayjs } from 'dayjs';

import { UploadOutlined } from '@ant-design/icons';
import {
  Alert,
  type AlertProps,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  List,
  message,
  Select,
  Space,
  Typography,
  Upload,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import type { InventoryChange, OrderEntity, PaymentMethod } from '../../types/order';

import { confirmOrderPayment, ensureCart } from '../../api/orders';
import { useAuth } from '../../context/AuthContext';
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

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: 'Efectivo', value: 'cash' },
  { label: 'Zelle', value: 'zelle' },
  { label: 'Pago Móvil', value: 'mobilePayment' },
  { label: 'Binance', value: 'binance' },
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart, replaceFromOrderLines } = useCart();
  const [order, setOrder] = useState<null | OrderEntity>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [inventoryAlert, setInventoryAlert] = useState<null | string>(null);
  const [alertType, setAlertType] = useState<AlertProps['type']>('warning');
  const [form] = Form.useForm();
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const today = dayjs();
  const minDate = today.subtract(7, 'day');

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
      if (user?.address) {
        form.setFieldValue('deliveryAddress', user.address);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [form, replaceFromOrderLines, user?.address, user?.firstName, user?.lastName]);

  const canPay = useMemo(
    () => !!order && order.status === 'pending' && order.products.length > 0,
    [order]
  );

  const handleScreenshotChange = (info: { file: File }) => {
    const file = info.file;
    if (file.size > 500 * 1024) {
      void message.error('La imagen debe ser menor a 500KB');
      setScreenshotFile(null);
      form.setFieldsValue({ screenshot: undefined });
      return;
    }
    setScreenshotFile(file);
  };

  const handlePay = async () => {
    if (!order) return;

    try {
      const values = await form.validateFields();
      const isCash = values.paymentMethod === 'cash';

      if (!isCash && !screenshotFile) {
        void message.error('Debes adjuntar el comprobante de pago');
        return;
      }

      setPaying(true);

      let paidAt: string | undefined;
      if (!isCash && values.paidAt) {
        const paidAtDate = values.paidAt as Dayjs;
        paidAt = paidAtDate.format('YYYY-MM-DDTHH:mm:ss[Z]');
      }

      const result = await confirmOrderPayment(order.id, {
        method: values.paymentMethod,
        reference: isCash ? undefined : values.reference,
        paidAt,
        screenshot: isCash ? undefined : (screenshotFile ?? undefined),
      });

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
          setAlertType('warning');
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
      setInventoryAlert('Pedido recibido. Te notificaremos cuando lo preparemos.');
      setAlertType('success');
      clearCart();
      setTimeout(() => navigate('/mis-compras'), 1500);
    } catch {
      setPaying(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Space direction="vertical" size={16} className="w-full">
        <Title level={2} className="!mb-0">
          Finalizar pedido
        </Title>
        {inventoryAlert ? <Alert type={alertType} message={inventoryAlert} showIcon /> : null}
        <Card loading={loading} title="Datos del cliente">
          {!order ? (
            <Paragraph>
              No hay orden pendiente. <Link to="/">Ir al catálogo</Link>
            </Paragraph>
          ) : (
            <Space direction="vertical" size={8} className="w-full">
              <Text>
                <strong>Nombre:</strong> {fullName || '—'}
              </Text>
              <Text>
                <strong>Email:</strong> {user?.email ?? '—'}
              </Text>
              <Text>
                <strong>Teléfono:</strong> {user?.phone ?? 'No registrado'}
              </Text>
            </Space>
          )}
        </Card>

        <Card title="Dirección de entrega">
          <Form form={form} layout="vertical">
            <Form.Item
              name="deliveryAddress"
              label="Dirección"
              rules={[{ required: true, message: 'La dirección es obligatoria' }]}
            >
              <Input.TextArea rows={2} placeholder="Ej: Calle 123, Caracas, Venezuela" />
            </Form.Item>
          </Form>
        </Card>

        <Card title="Método de pago">
          <Space direction="vertical" size={12} className="w-full">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                paymentMethod: 'cash',
                paidAt: today,
              }}
            >
              <Form.Item
                name="paymentMethod"
                label="Método de pago"
                rules={[{ required: true, message: 'Selecciona un método de pago' }]}
              >
                <Select options={PAYMENT_METHODS} />
              </Form.Item>

              <Form.Item
                name="reference"
                label="Número de confirmación"
                rules={[
                  { required: true, message: 'El número de confirmación es obligatorio' },
                  { min: 3, message: 'Mínimo 3 caracteres' },
                ]}
              >
                <Input placeholder="Email Zelle, teléfono o ID de transacción" />
              </Form.Item>

              <Form.Item
                name="paidAt"
                label="Fecha de pago"
                rules={[{ required: true, message: 'La fecha de pago es obligatoria' }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  disabledDate={(current) => current.isAfter(today) || current.isBefore(minDate)}
                  className="w-full"
                />
              </Form.Item>

              <Form.Item label="Comprobante de pago (opcional para pago en efectivo)">
                <Upload
                  accept="image/jpeg,image/png,image/webp"
                  maxCount={1}
                  beforeUpload={(file) => {
                    handleScreenshotChange({ file });
                    return false;
                  }}
                  onRemove={() => {
                    setScreenshotFile(null);
                    form.setFieldsValue({ screenshot: undefined });
                  }}
                  fileList={
                    screenshotFile
                      ? [
                          {
                            uid: '-1',
                            name: screenshotFile.name,
                            status: 'done',
                            size: screenshotFile.size,
                          },
                        ]
                      : []
                  }
                >
                  <Button icon={<UploadOutlined />}>Adjuntar imagen (máx 500KB)</Button>
                </Upload>
                <Text type="secondary" className="text-xs">
                  Formatos: JPG, PNG, WEBP. Máximo 500KB.
                </Text>
              </Form.Item>
            </Form>
          </Space>
        </Card>

        <Card title="Resumen del pedido">
          {!order ? (
            <Paragraph>
              No hay orden pendiente. <Link to="/">Ir al catálogo</Link>
            </Paragraph>
          ) : (
            <Space direction="vertical" size={12} className="w-full">
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
              <Button
                type="primary"
                loading={paying}
                disabled={!canPay}
                onClick={handlePay}
                size="large"
                className="w-full"
              >
                Confirmar pedido
              </Button>
            </Space>
          )}
        </Card>
      </Space>
    </section>
  );
};

export default CheckoutPage;
