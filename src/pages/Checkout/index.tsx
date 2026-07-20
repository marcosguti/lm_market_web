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
import { getStores, type Store } from '../../api/stores';
import { AddressMapPicker } from '../../components/AddressMapPicker';
import { PATHS } from '../../constants/paths';
import { formatBs, usdToBs } from '../../constants/pricing';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useUsdRate } from '../../context/ExchangeRateContext';
import {
  getInventoryMessage as buildInventoryMessage,
  isMegasoftP2cCheckout,
  isScreenshotTooLarge,
} from '../../utils/checkoutPayment';
import {
  DELIVERY_CITY_LABELS,
  type DeliveryCitySlug,
  isDeliveryCitySlug,
} from '../../utils/deliveryCities';
import { DATE_PICKER_FORMAT } from '../../utils/formatDate';
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

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  binance: 'Binance',
  cash: 'Efectivo',
  mobilePayment: 'Pago Móvil',
  zelle: 'Zelle',
};

const DEFAULT_SCREENSHOT_HELP = 'Obligatorio. Un administrador revisará el comprobante.';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { setUser, user } = useAuth();
  const { clearCart, flushCartSync, replaceFromOrderLines } = useCart();
  const liveUsdRate = useUsdRate();
  const [order, setOrder] = useState<null | OrderEntity>(null);
  const [stores, setStores] = useState<Store[]>([]);
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
  const [pickingAddress, setPickingAddress] = useState(false);

  const paymentMethod = Form.useWatch('paymentMethod', form) as PaymentMethod | undefined;
  const megasoftP2c = isMegasoftP2cCheckout(paymentConfig?.megasoftEnabled, paymentMethod);

  const paymentMethodOptions = useMemo(
    () =>
      (paymentConfig?.methods ?? []).map((m) => ({
        label: PAYMENT_METHOD_LABELS[m.method] ?? m.method,
        value: m.method,
      })),
    [paymentConfig?.methods],
  );

  const selectedMethodConfig = useMemo(
    () => paymentConfig?.methods.find((m) => m.method === paymentMethod) ?? null,
    [paymentConfig?.methods, paymentMethod],
  );

  const methodPlaceholder = selectedMethodConfig?.placeholder?.trim() || null;
  const screenshotHelp = methodPlaceholder || DEFAULT_SCREENSHOT_HELP;
  const methodInformation = selectedMethodConfig?.information?.trim() || null;
  const notePlaceholder = methodPlaceholder || 'Detalle adicional del pago';
  const noteEnabled = Boolean(selectedMethodConfig?.noteEnabled);

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const today = dayjs();
  const minDate = today.subtract(7, 'day');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const [syncResult, configResult, banksResult, storesList] = await Promise.all([
        flushCartSync(),
        getPaymentConfig(),
        getPaymentBanks(),
        getStores(),
      ]);
      if (cancelled) return;
      setLoading(false);

      if (configResult.ok && configResult.data) {
        setPaymentConfig(configResult.data);
        const activeMethods = configResult.data.methods ?? [];
        const currentMethod = form.getFieldValue('paymentMethod') as PaymentMethod | undefined;
        const stillActive = activeMethods.some((m) => m.method === currentMethod);
        if (!stillActive && activeMethods.length > 0) {
          form.setFieldsValue({ paymentMethod: activeMethods[0].method });
        }
      }
      if (banksResult.ok && banksResult.data?.banks) {
        setBanks(banksResult.data.banks);
      }
      setStores(storesList);

      if (!syncResult.ok || !syncResult.order) {
        void message.error(syncResult.error ?? 'No se pudo sincronizar el carrito con el servidor');
        return;
      }
      setOrder(syncResult.order);
      replaceFromOrderLines(syncResult.order.products);
      setInventoryAlert(getInventoryMessage(syncResult.changes ?? []));
      if (user?.phone) {
        form.setFieldValue('payerPhone', user.phone);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [flushCartSync, form, replaceFromOrderLines, user?.phone]);

  const checkoutStore = useMemo(
    () => stores.find((store) => store.id === order?.storeId) ?? null,
    [order?.storeId, stores]
  );
  const storeCity = isDeliveryCitySlug(checkoutStore?.city) ? checkoutStore.city : null;
  const addressMatchesStore =
    Boolean(user?.addressCity) &&
    Boolean(storeCity) &&
    user?.addressCity === storeCity &&
    user?.addressLatitude != null &&
    user?.addressLongitude != null &&
    Boolean(user?.address?.trim());

  const canPay = useMemo(
    () =>
      !!order &&
      order.status === 'pending' &&
      order.products.length > 0 &&
      addressMatchesStore &&
      !pickingAddress,
    [addressMatchesStore, order, pickingAddress]
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
      setTimeout(() => navigate(PATHS.myOrders), 1500);
    }
  };

  const handlePay = async () => {
    if (!order) return;
    if (!addressMatchesStore) {
      void message.error(
        checkoutStore
          ? `Elige una nueva dirección en la misma ciudad de ${checkoutStore.name}`
          : 'Configura tu dirección en el mapa antes de pagar'
      );
      setPickingAddress(true);
      return;
    }

    try {
      const values = await form.validateFields();
      setPaying(true);

      if (megasoftP2c) {
        const amount = megasoftAmountBs ?? usdToBs(order.totalAmount, checkoutRate);
        const result = await verifyMobilePayment(order.id, {
          amount,
          bankCode: values.payerBankCode as string,
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
          if (payload?.code === 'ADDRESS_REQUIRED' || payload?.code === 'ADDRESS_CITY_MISMATCH') {
            setPickingAddress(true);
            void message.error(payload.error ?? 'Debes elegir una dirección válida');
            return;
          }
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
      const methodAllowsNote = Boolean(
        paymentConfig?.methods.find((m) => m.method === values.paymentMethod)?.noteEnabled,
      );

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
        method: values.paymentMethod,
        note:
          methodAllowsNote && values.paymentNote
            ? String(values.paymentNote).trim()
            : undefined,
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
        if (payload?.code === 'ADDRESS_REQUIRED' || payload?.code === 'ADDRESS_CITY_MISMATCH') {
          setPickingAddress(true);
        }
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
              No hay orden pendiente. <Link to={PATHS.home}>Ir al catálogo</Link>
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
          {!storeCity ? (
            <Alert
              type="warning"
              showIcon
              message="La tienda del carrito no tiene ciudad configurada."
            />
          ) : pickingAddress || !addressMatchesStore ? (
            <Space direction="vertical" size={12} className="w-full">
              <Alert
                type="warning"
                showIcon
                message={`Elige una nueva dirección en la misma ciudad de ${
                  checkoutStore?.name ?? 'la tienda'
                }`}
                description={`La entrega debe estar en ${DELIVERY_CITY_LABELS[storeCity as DeliveryCitySlug]}.`}
              />
              <AddressMapPicker
                expectedCity={storeCity}
                storeName={checkoutStore?.name}
                initialLat={user?.addressLatitude}
                initialLng={user?.addressLongitude}
                onSaved={(nextUser) => {
                  if (user) {
                    setUser({ ...user, ...nextUser });
                  }
                  setPickingAddress(false);
                  void message.success('Dirección actualizada');
                }}
              />
              {addressMatchesStore ? (
                <Button onClick={() => setPickingAddress(false)}>Cancelar</Button>
              ) : null}
            </Space>
          ) : (
            <Space direction="vertical" size={12} className="w-full">
              <Alert
                type="success"
                showIcon
                message="Usar mi ubicación actual"
                description={
                  <Space direction="vertical" size={2}>
                    <Text>{user?.address}</Text>
                    <Text type="secondary">
                      Ciudad:{' '}
                      {isDeliveryCitySlug(user?.addressCity)
                        ? DELIVERY_CITY_LABELS[user.addressCity]
                        : user?.addressCity}
                    </Text>
                  </Space>
                }
              />
              <Button onClick={() => setPickingAddress(true)}>Elegir otra ubicación</Button>
            </Space>
          )}
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
                <Select
                  options={paymentMethodOptions}
                  placeholder={
                    paymentMethodOptions.length === 0
                      ? 'No hay métodos de pago disponibles'
                      : 'Selecciona un método'
                  }
                  disabled={paymentMethodOptions.length === 0}
                />
              </Form.Item>

              {methodInformation ? (
                <Alert
                  type="info"
                  showIcon
                  className="mb-4"
                  message="Información del método de pago"
                  description={
                    <Text style={{ whiteSpace: 'pre-wrap' }}>{methodInformation}</Text>
                  }
                />
              ) : null}

              {megasoftP2c ? (
                <>
                  {order && megasoftAmountBs !== null ? (
                    <Alert
                      type="info"
                      showIcon
                      className="mb-4"
                      message="Monto a pagar"
                      description={
                        <Space direction="vertical" size={2}>
                          <Text strong>Bs {formatMoney(megasoftAmountBs)}</Text>
                          <Text strong>$ {formatMoney(order.totalAmount)}</Text>
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

                  {noteEnabled ? (
                    <Form.Item
                      name="paymentNote"
                      label="Nota (opcional)"
                      rules={[{ max: 100, message: 'Máximo 100 caracteres' }]}
                    >
                      <Input.TextArea
                        rows={2}
                        maxLength={100}
                        showCount
                        placeholder={notePlaceholder}
                      />
                    </Form.Item>
                  ) : null}

                  <Form.Item label="Comprobante de pago" required help={screenshotHelp}>
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
              No hay orden pendiente. <Link to={PATHS.home}>Ir al catálogo</Link>
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
          navigate(PATHS.myOrders);
        }}
        onCancel={() => {
          setVoucherOpen(false);
          navigate(PATHS.myOrders);
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
