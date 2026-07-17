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
  Modal,
  Select,
  Space,
  Typography,
  Upload,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import type { InventoryChange, OrderEntity, PaymentMethod } from '../../types/order';

import { confirmOrderPayment } from '../../api/orders';
import {
  getPaymentBanks,
  getPaymentConfig,
  type PaymentConfig,
  type VenezuelanBank,
  verifyMobilePayment,
} from '../../api/payments';
import { formatBs, usdToBs } from '../../constants/pricing';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useUsdRate } from '../../context/ExchangeRateContext';
import { DATE_PICKER_FORMAT } from '../../utils/formatDate';
import {
  getInventoryMessage as buildInventoryMessage,
  isMegasoftP2cCheckout,
  isScreenshotTooLarge,
} from '../../utils/checkoutPayment';
import { normalizeVoucherText } from '../../utils/voucher';

const { Paragraph, Text, Title } = Typography;

function formatMoney(value: number) {
  return value.toLocaleString('es-VE', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function getInventoryMessage(changes: InventoryChange[]) {
  return buildInventoryMessage(changes.length);
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
  const { clearCart, flushCartSync, replaceFromOrderLines } = useCart();
  const liveUsdRate = useUsdRate();
  const [order, setOrder] = useState<null | OrderEntity>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [inventoryAlert, setInventoryAlert] = useState<null | string>(null);
  const [alertType, setAlertType] = useState<AlertProps['type']>('warning');
  const [form] = Form.useForm();
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [banks, setBanks] = useState<VenezuelanBank[]>([]);
  const [voucherText, setVoucherText] = useState<string | null>(null);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherErrorOpen, setVoucherErrorOpen] = useState(false);

  const paymentMethod = Form.useWatch('paymentMethod', form) as PaymentMethod | undefined;
  const megasoftP2c = isMegasoftP2cCheckout(paymentConfig?.megasoftEnabled, paymentMethod);

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const today = dayjs();
  const minDate = today.subtract(7, 'day');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const [syncResult, configResult, banksResult] = await Promise.all([
        flushCartSync(),
        getPaymentConfig(),
        getPaymentBanks(),
      ]);
      if (cancelled) return;
      setLoading(false);

      if (configResult.ok && configResult.data) {
        setPaymentConfig(configResult.data);
      }
      if (banksResult.ok && banksResult.data?.banks) {
        setBanks(banksResult.data.banks);
      }

      if (!syncResult.ok || !syncResult.order) {
        void message.error(syncResult.error ?? 'No se pudo sincronizar el carrito con el servidor');
        return;
      }
      setOrder(syncResult.order);
      replaceFromOrderLines(syncResult.order.products);
      setInventoryAlert(getInventoryMessage(syncResult.changes ?? []));
      if (user?.address) {
        form.setFieldValue('deliveryAddress', user.address);
      }
      if (user?.phone) {
        form.setFieldValue('payerPhone', user.phone);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [flushCartSync, form, replaceFromOrderLines, user?.address, user?.phone]);

  const canPay = useMemo(
    () => !!order && order.status === 'pending' && order.products.length > 0,
    [order]
  );

  const checkoutRate =
    paymentConfig?.usdRate && paymentConfig.usdRate > 0 ? paymentConfig.usdRate : liveUsdRate;

  const megasoftAmountBs = useMemo(
    () => (order && megasoftP2c ? usdToBs(order.totalAmount, checkoutRate) : null),
    [checkoutRate, megasoftP2c, order]
  );

  const orderTotalBs = useMemo(
    () => (order ? formatBs(order.totalAmount, checkoutRate) : null),
    [checkoutRate, order]
  );

  const handleScreenshotChange = (info: { file: File }) => {
    const file = info.file;
    if (isScreenshotTooLarge(file.size)) {
      void message.error('La imagen debe ser menor a 500KB');
      setScreenshotFile(null);
      form.setFieldsValue({ screenshot: undefined });
      return;
    }
    setScreenshotFile(file);
  };

  const handleInventoryConflict = (payload: {
    code?: string;
    details?: { changes?: InventoryChange[]; order?: OrderEntity };
    error?: string;
  }) => {
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
      return true;
    }
    return false;
  };

  const finishSuccess = (updatedOrder: OrderEntity, voucher?: string) => {
    setOrder(updatedOrder);
    if (voucher) {
      setVoucherText(normalizeVoucherText(voucher));
      setVoucherOpen(true);
    }
    setInventoryAlert(
      updatedOrder.status === 'paymentPendingConfirmation'
        ? 'Comprobante enviado. Un administrador lo revisará y te notificaremos cuando el pago sea confirmado.'
        : 'Pago confirmado. Te notificaremos cuando preparemos tu pedido.'
    );
    setAlertType('success');
    clearCart({ afterCheckout: true });
    if (!voucher) {
      setTimeout(() => navigate('/mis-compras'), 1500);
    }
  };

  const handlePay = async () => {
    if (!order) return;

    try {
      const values = await form.validateFields();
      setPaying(true);

      if (megasoftP2c) {
        const amount = megasoftAmountBs ?? usdToBs(order.totalAmount, checkoutRate);
        const result = await verifyMobilePayment(order.id, {
          amount,
          bankCode: values.payerBankCode as string,
          deliveryAddress: values.deliveryAddress as string,
          nationalId: values.payerNationalId as string,
          phone: values.payerPhone as string,
          reference: values.payerReference as string,
        });
        setPaying(false);

        if (!result.ok) {
          const payload = result.data as {
            code?: string;
            details?: { changes?: InventoryChange[]; order?: OrderEntity };
            error?: string;
            voucher?: string;
          };
          if (handleInventoryConflict(payload)) return;
          if (payload?.code === 'MEGASOFT_PLATFORM_ERROR') {
            Modal.error({
              content: payload.error ?? 'Problema en la plataforma bancaria. Intenta nuevamente.',
              title: 'Plataforma no disponible',
            });
            return;
          }
          if (payload?.voucher) {
            setVoucherText(normalizeVoucherText(payload.voucher));
            setVoucherErrorOpen(true);
          }
          void message.error(payload?.error ?? 'No se pudo verificar el pago móvil');
          return;
        }

        const data = result.data as {
          order?: OrderEntity;
          voucher?: string;
        };
        if (!data?.order) {
          void message.error('No se recibió la orden actualizada');
          return;
        }
        finishSuccess(data.order, data.voucher);
        return;
      }

      const isCash = values.paymentMethod === 'cash';

      if (!screenshotFile) {
        setPaying(false);
        void message.error('Debes adjuntar el comprobante de pago');
        return;
      }

      let paidAt: string | undefined;
      if (!isCash && values.paidAt) {
        const paidAtDate = values.paidAt as Dayjs;
        paidAt = paidAtDate.format('YYYY-MM-DDTHH:mm:ss[Z]');
      }

      const result = await confirmOrderPayment(order.id, {
        deliveryAddress: values.deliveryAddress as string,
        method: values.paymentMethod,
        reference: isCash ? undefined : values.reference,
        paidAt,
        screenshot: screenshotFile,
      });

      setPaying(false);

      if (!result.ok) {
        const payload = result.data as {
          code?: string;
          details?: { changes?: InventoryChange[]; order?: OrderEntity };
          error?: string;
        };
        if (handleInventoryConflict(payload)) return;
        void message.error(payload?.error ?? 'No se pudo confirmar el pago');
        return;
      }

      if (!result.data?.order) {
        void message.error('No se recibió la orden actualizada');
        return;
      }

      finishSuccess(result.data.order);
    } catch {
      setPaying(false);
    }
  };

  const merchant = paymentConfig?.merchant;

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
              rules={[
                { required: true, message: 'La dirección es obligatoria' },
                { max: 500, message: 'Máximo 500 caracteres' },
              ]}
            >
              <Input.TextArea
                rows={2}
                maxLength={500}
                showCount
                placeholder="Ej: Calle 123, Caracas, Venezuela"
              />
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

              {megasoftP2c ? (
                <>
                  {merchant ? (
                    <Alert
                      type="info"
                      showIcon
                      className="mb-4"
                      message="Datos para transferir (Pago Móvil)"
                      description={
                        <Space direction="vertical" size={2}>
                          {merchant.rif ? <Text>RIF: {merchant.rif}</Text> : null}
                          <Text>
                            Banco: {merchant.bankName} ({merchant.bankCode})
                          </Text>
                          <Text>Teléfono comercio: {merchant.phone || '—'}</Text>
                          {order && megasoftAmountBs !== null ? (
                            <Text strong>Monto exacto: Bs {formatMoney(megasoftAmountBs)}</Text>
                          ) : null}
                        </Space>
                      }
                    />
                  ) : null}
                  <Form.Item
                    name="payerNationalId"
                    label="Cédula del pagador"
                    rules={[
                      { required: true, message: 'La cédula es obligatoria' },
                      { min: 3, message: 'Mínimo 3 caracteres' },
                    ]}
                  >
                    <Input placeholder="Ej: 17322319 o Integrador (certificación)" />
                  </Form.Item>
                  <Form.Item
                    name="payerPhone"
                    label="Teléfono del pagador"
                    rules={[
                      { required: true, message: 'El teléfono es obligatorio' },
                      { min: 3, message: 'Mínimo 3 caracteres' },
                    ]}
                  >
                    <Input placeholder="Ej: 04120765408 o Integrador (certificación)" />
                  </Form.Item>
                  <Form.Item
                    name="payerReference"
                    label="Referencia del pago móvil"
                    rules={[
                      { required: true, message: 'La referencia es obligatoria' },
                      { min: 3, message: 'Mínimo 3 caracteres' },
                    ]}
                  >
                    <Input placeholder="Ej: 1234567890" />
                  </Form.Item>
                  <Form.Item
                    name="payerBankCode"
                    label="Banco emisor"
                    rules={[{ required: true, message: 'Selecciona el banco emisor' }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Selecciona tu banco"
                      options={banks.map((b) => ({
                        label: `${b.name} (${b.code})`,
                        value: b.code,
                      }))}
                    />
                  </Form.Item>
                  {megasoftAmountBs !== null ? (
                    <Form.Item label="Monto a pagar">
                      <Input readOnly value={`Bs ${formatMoney(megasoftAmountBs)}`} />
                    </Form.Item>
                  ) : null}
                </>
              ) : (
                <>
                  {paymentMethod !== 'cash' ? (
                    <>
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
                          format={DATE_PICKER_FORMAT}
                          disabledDate={(current) =>
                            current.isAfter(today) || current.isBefore(minDate)
                          }
                          className="w-full"
                        />
                      </Form.Item>
                    </>
                  ) : null}

                  <Form.Item
                    label="Comprobante de pago"
                    required
                    help="Obligatorio. Un administrador revisará el comprobante."
                  >
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
                </>
              )}
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
                      <Text>Bs {formatBs(line.lineTotal, checkoutRate)}</Text>
                    </div>
                  </List.Item>
                )}
              />
              <div className="flex items-center justify-between border-t pt-4">
                <Text strong>Total</Text>
                <Text strong>Bs {orderTotalBs}</Text>
              </div>
              <Button
                type="primary"
                loading={paying}
                disabled={!canPay}
                onClick={handlePay}
                size="large"
                className="w-full"
              >
                {megasoftP2c ? 'Verificar pago móvil' : 'Confirmar pedido'}
              </Button>
            </Space>
          )}
        </Card>
      </Space>

      <Modal
        title="Comprobante de pago"
        open={voucherOpen}
        onOk={() => {
          setVoucherOpen(false);
          navigate('/mis-compras');
        }}
        onCancel={() => {
          setVoucherOpen(false);
          navigate('/mis-compras');
        }}
        okText="Ir a mis compras"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <pre className="whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm">{voucherText}</pre>
      </Modal>

      <Modal
        title="Pago rechazado"
        open={voucherErrorOpen}
        onOk={() => setVoucherErrorOpen(false)}
        onCancel={() => setVoucherErrorOpen(false)}
        okText="Cerrar"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <pre className="whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm">{voucherText}</pre>
      </Modal>
    </section>
  );
};

export default CheckoutPage;
