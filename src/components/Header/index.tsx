import { BellOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import {
  Badge,
  Button,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  type MenuProps,
  message,
  Modal,
  Popover,
  Select,
  Skeleton,
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import type { EmailVerificationLocationState } from '../../types/emailVerification';

import { getNotifications, markAllNotificationsRead } from '../../api/notifications';
import { PATHS } from '../../constants/paths';
import { formatBs } from '../../constants/pricing';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useUsdRate } from '../../context/ExchangeRateContext';
import { useHomeCatalog } from '../../context/HomeCatalogContext';
import { connectSocket } from '../../realtime/socket';
import { theme } from '../../theme';
import { getMaxOrderQuantity } from '../../utils/cartStock';
import { formatDateTime } from '../../utils/formatDate';
import { formatNotificationBody, formatNotificationTitle } from '../../utils/notification';
import VerifyEmailLoginModal from '../VerifyEmailLoginModal';

const HEADER_BTN_CLASS =
  '!h-9 !min-h-9 !inline-flex !items-center !justify-center !px-4 !leading-none';
const HEADER_ICON_BTN_CLASS =
  '!h-9 !w-9 !min-h-9 !min-w-9 !inline-flex !items-center !justify-center !p-0';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === PATHS.home;
  const homeCatalog = useHomeCatalog();
  const { user, isLoading, login, logout } = useAuth();
  const canShop = !user || user.type === 'client';
  const {
    cart,
    cartSubtotal,
    clearCart,
    flushCartSync,
    removeFromCart,
    totalItemCount,
    updateQuantity,
  } = useCart();
  const usdRate = useUsdRate();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutSyncing, setCheckoutSyncing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [verifyModal, setVerifyModal] = useState<{
    codeExpiresInSeconds: number;
    email: string;
  } | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    {
      body: string;
      createdAt: string;
      id: string;
      orderId: null | string;
      payload: null | Record<string, unknown>;
      persisted: boolean;
      readAt: null | string;
      title: string;
      type: string;
    }[]
  >([]);
  const [form] = Form.useForm<{ email: string; password: string }>();
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const notificationsFetchedForUserId = useRef<string | null>(null);
  const notificationsOpenRef = useRef(false);

  useEffect(() => {
    notificationsOpenRef.current = notificationsOpen;
  }, [notificationsOpen]);

  const handleNotificationsOpenChange = (open: boolean) => {
    setNotificationsOpen(open);
    if (!open) {
      return;
    }

    setNotifications((prev) => {
      const hasUnread = prev.some((notification) => !notification.readAt);
      if (!hasUnread) {
        return prev;
      }

      void markAllNotificationsRead();
      const readAt = new Date().toISOString();
      return prev.map((notification) =>
        notification.readAt ? notification : { ...notification, readAt }
      );
    });
  };

  const handleOpenLogin = () => {
    setLoginModalOpen(true);
    setLoginError('');
    form.resetFields();
  };

  const handleLoginSubmit = async (): Promise<void> => {
    setLoginError('');
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    setLoginLoading(true);
    const result = await login(values.email, values.password);
    setLoginLoading(false);
    if (result.code === 'EMAIL_NOT_VERIFIED') {
      setLoginModalOpen(false);
      form.resetFields();
      setVerifyModal({
        codeExpiresInSeconds: result.codeExpiresInSeconds ?? 0,
        email: result.email ?? values.email,
      });
      return;
    }
    if (result.error) {
      setLoginError(result.error);
      throw new Error(result.error);
    }
    setLoginModalOpen(false);
    form.resetFields();
  };

  const handleContinueVerification = (state: EmailVerificationLocationState) => {
    setVerifyModal(null);
    navigate(PATHS.verifyEmail, { replace: true, state });
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const formattedTotalBs = useMemo(() => formatBs(cartSubtotal, usdRate), [cartSubtotal, usdRate]);
  const selectedStoreName = useMemo(() => {
    if (!homeCatalog?.selectedStoreId) return '';
    return homeCatalog.stores.find((s) => s.id === homeCatalog.selectedStoreId)?.name ?? '';
  }, [homeCatalog?.selectedStoreId, homeCatalog?.stores]);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications]
  );

  useEffect(() => {
    if (!user) {
      notificationsFetchedForUserId.current = null;
      queueMicrotask(() => setNotifications([]));
      return;
    }

    let cancelled = false;
    const token = localStorage.getItem('lm_market_token');
    const userId = user.id;

    const run = async () => {
      if (notificationsFetchedForUserId.current === userId) return;
      notificationsFetchedForUserId.current = userId;
      const response = await getNotifications({ inbox: true, recentRead: 5 });
      if (!cancelled && response.ok && response.data?.data) {
        setNotifications(
          response.data.data.map((item) => ({
            body: item.body,
            createdAt: item.createdAt,
            id: item.id,
            orderId: item.orderId,
            payload: item.payload,
            persisted: true,
            readAt: item.readAt,
            title: item.title,
            type: item.type,
          }))
        );
      }
    };
    void run();

    if (!token) {
      return () => {
        cancelled = true;
      };
    }

    const socket = connectSocket(token);
    const onNotification = (payload: {
      body?: string;
      newStatus?: string;
      orderId?: string;
      previousStatus?: string;
      status?: string;
      title?: string;
      type?: string;
    }) => {
      const now = new Date().toISOString();
      const notificationPayload =
        payload.previousStatus && payload.newStatus
          ? { newStatus: payload.newStatus, previousStatus: payload.previousStatus }
          : null;
      const rawBody = payload.body ?? 'Tu orden fue actualizada';
      const next = {
        body: rawBody,
        createdAt: now,
        id: `${now}-${Math.random().toString(16).slice(2)}`,
        orderId: payload.orderId ?? null,
        payload: notificationPayload,
        persisted: false,
        readAt: notificationsOpenRef.current ? now : null,
        title: payload.title ?? 'Notificación',
        type: payload.type ?? 'ORDER_STATUS_CHANGED',
      };
      setNotifications((prev) => [next, ...prev].slice(0, 30));
      if (notificationsOpenRef.current) {
        void markAllNotificationsRead();
      }

      const status = payload.status;
      const shouldDesktop =
        status === 'preparing' ||
        status === 'readyForDelivery' ||
        status === 'assignedToDeliveryDriver' ||
        status === 'delivering';
      if (
        shouldDesktop &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        void new Notification(next.title, {
          body: formatNotificationBody(next.body, next.payload, next.type),
        });
      }
    };

    socket.on('notification:new', onNotification);
    return () => {
      cancelled = true;
      socket.off('notification:new', onNotification);
    };
  }, [user?.id]);

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'cuenta',
      label: (
        <Link
          className="no-underline hover:no-underline"
          to={PATHS.account}
          onClick={() => setMobileMenuOpen(false)}
        >
          Mi cuenta
        </Link>
      ),
    },
    ...(user?.type === 'client'
      ? [
          {
            key: 'mis-compras',
            label: (
              <Link
                className="no-underline hover:no-underline"
                to={PATHS.myOrders}
                onClick={() => setMobileMenuOpen(false)}
              >
                Mis compras
              </Link>
            ),
          },
        ]
      : []),
    ...(user?.type === 'admin' || user?.type === 'superAdmin'
      ? [
          {
            key: 'orders',
            label: (
              <Link className="no-underline hover:no-underline" to={PATHS.orders}>
                Panel órdenes
              </Link>
            ),
          },
          {
            key: 'users',
            label: (
              <Link className="no-underline hover:no-underline" to={PATHS.users}>
                Usuarios
              </Link>
            ),
          },
          {
            key: 'productos',
            label: (
              <Link className="no-underline hover:no-underline" to={PATHS.products}>
                Productos
              </Link>
            ),
          },
          {
            key: 'ofertas',
            label: (
              <Link className="no-underline hover:no-underline" to={PATHS.deals}>
                Ofertas
              </Link>
            ),
          },
          {
            key: 'banners',
            label: (
              <Link className="no-underline hover:no-underline" to={PATHS.banners}>
                Banners
              </Link>
            ),
          },
          {
            key: 'blog-articles-admin',
            label: (
              <Link className="no-underline hover:no-underline" to={PATHS.blogArticlesAdmin}>
                Gestionar blog
              </Link>
            ),
          },
          ...(user?.type === 'superAdmin'
            ? [
                {
                  key: 'metodos-pago',
                  label: (
                    <Link className="no-underline hover:no-underline" to={PATHS.paymentMethods}>
                      Métodos de pago
                    </Link>
                  ),
                },
                {
                  key: 'sincronizacion',
                  label: (
                    <Link className="no-underline hover:no-underline" to={PATHS.syncStatus}>
                      Sincronización
                    </Link>
                  ),
                },
              ]
            : []),
        ]
      : []),
    {
      key: 'logout',
      label: 'Cerrar sesión',
      onClick: handleLogout,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full overflow-x-hidden bg-white shadow-md">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link className="flex items-center no-underline hover:no-underline" to={PATHS.home}>
            <img src="/logo.png" alt="LM Market" className="h-16 w-auto" />
          </Link>
          <nav className="hidden md:ml-auto md:flex md:items-center md:gap-6">
            <Link
              to={PATHS.home}
              className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
            >
              Inicio
            </Link>
            <Link
              to={PATHS.about}
              className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
            >
              Nosotros
            </Link>
            <Link
              to={PATHS.blog}
              className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
            >
              Blog
            </Link>
            <Link
              to={PATHS.faq}
              className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
            >
              Preguntas Frecuentes
            </Link>
            {isLoading ? (
              <Skeleton.Button active size="default" style={{ height: 36, minWidth: 180 }} />
            ) : user ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                <Button type="default" className={`${HEADER_BTN_CLASS} !gap-2 text-gray-700`}>
                  <span className="hidden sm:inline">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="font-medium text-primary">Mi cuenta</span>
                </Button>
              </Dropdown>
            ) : (
              <>
                <Button className={HEADER_BTN_CLASS} onClick={handleOpenLogin} type="primary">
                  Iniciar sesión
                </Button>
                <Link className="no-underline hover:no-underline" to={PATHS.register}>
                  <Button className={HEADER_BTN_CLASS} type="default">
                    Registro
                  </Button>
                </Link>
              </>
            )}
            <Link className="no-underline hover:no-underline" to={PATHS.contact}>
              <Button className={HEADER_BTN_CLASS} type="primary">
                Contacto
              </Button>
            </Link>
            {user ? (
              <Popover
                trigger="click"
                open={notificationsOpen}
                onOpenChange={handleNotificationsOpenChange}
                content={
                  <div className="max-h-[70vh] w-[320px] max-w-[80vw] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="m-0 text-sm text-gray-500">Sin notificaciones</p>
                    ) : (
                      <List
                        size="small"
                        dataSource={notifications}
                        renderItem={(item) => (
                          <List.Item
                            className="cursor-pointer"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            <List.Item.Meta
                              title={
                                <span className="text-sm font-semibold">
                                  {formatNotificationTitle(item.title, item.orderId)}
                                  {!item.readAt ? (
                                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />
                                  ) : null}
                                </span>
                              }
                              description={
                                <span className="text-xs text-gray-500">
                                  {formatNotificationBody(item.body, item.payload, item.type)}
                                  <br />
                                  {formatDateTime(item.createdAt)}
                                </span>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </div>
                }
              >
                <Badge
                  color={theme.token.colorPrimary}
                  count={unreadCount}
                  offset={[-2, 2]}
                  size="small"
                >
                  <Button
                    aria-label="Notificaciones"
                    className={HEADER_ICON_BTN_CLASS}
                    icon={<BellOutlined className="size-5" />}
                    type="text"
                  />
                </Badge>
              </Popover>
            ) : null}
            {canShop ? (
              <Badge
                color={theme.token.colorPrimary}
                count={totalItemCount}
                offset={[-4, 4]}
                size="small"
              >
                <Button
                  aria-label="Carrito"
                  className={HEADER_ICON_BTN_CLASS}
                  icon={<ShoppingCartOutlined className="size-5" />}
                  type="text"
                  onClick={() => setCartDrawerOpen(true)}
                />
              </Badge>
            ) : null}
          </nav>
          <div className="flex items-center gap-[8px] md:hidden">
            {canShop ? (
              <Badge
                color={theme.token.colorPrimary}
                count={totalItemCount}
                offset={[-4, 4]}
                size="small"
              >
                <Button
                  aria-label="Carrito"
                  className={HEADER_ICON_BTN_CLASS}
                  icon={<ShoppingCartOutlined className="size-5" />}
                  type="text"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setCartDrawerOpen(true);
                  }}
                />
              </Badge>
            ) : null}
            {isLoading ? (
              <Skeleton.Button active size="default" style={{ height: 36, minWidth: 60 }} />
            ) : user ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                <Button className={HEADER_BTN_CLASS} type="default">
                  {user.firstName}
                </Button>
              </Dropdown>
            ) : (
              <>
                <Button className={HEADER_BTN_CLASS} onClick={handleOpenLogin} type="primary">
                  Entrar
                </Button>
                <Link className="no-underline hover:no-underline" to={PATHS.register}>
                  <Button className={HEADER_BTN_CLASS} type="default">
                    Registro
                  </Button>
                </Link>
              </>
            )}
            <Button
              aria-label="Alternar menú"
              className={`${HEADER_ICON_BTN_CLASS} md:hidden`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="text"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>
        {isHome && homeCatalog ? (
          <div className="border-t border-gray-100 bg-gray-50 py-[12px]">
            <div className="flex flex-col gap-[10px] lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <Input.Search
                  allowClear
                  placeholder="Buscar productos…"
                  size="large"
                  value={homeCatalog.search}
                  onChange={(e) => homeCatalog.setSearch(e.target.value)}
                  onSearch={() => homeCatalog.scrollToCatalog()}
                  className="[&_.ant-input-affix-wrapper]:rounded-xl [&_.ant-input-affix-wrapper]:border-gray-200 [&_.ant-input-affix-wrapper]:bg-white"
                />
              </div>
              <div className="flex flex-col gap-[6px] sm:flex-row sm:items-center sm:gap-[12px]">
                {selectedStoreName ? (
                  <p className="m-0 shrink-0 text-xs text-gray-600 sm:text-sm">
                    Comprando en:{' '}
                    <span className="font-semibold text-gray-900">{selectedStoreName}</span>
                  </p>
                ) : null}
                <Select
                  className="w-full min-w-[180px] sm:w-[220px]"
                  options={homeCatalog.stores.map((s) => ({ label: s.name, value: s.id }))}
                  placeholder="Tienda"
                  size="large"
                  value={homeCatalog.selectedStoreId || undefined}
                  onChange={homeCatalog.handleStoreChange}
                />
              </div>
            </div>
          </div>
        ) : null}
        {mobileMenuOpen && (
          <nav className="border-t border-gray-200 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <Link
                className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
                to={PATHS.home}
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
                to={PATHS.about}
                onClick={() => setMobileMenuOpen(false)}
              >
                Nosotros
              </Link>
              <Link
                className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
                to={PATHS.blog}
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
                to={PATHS.faq}
                onClick={() => setMobileMenuOpen(false)}
              >
                Preguntas Frecuentes
              </Link>
              {user ? (
                <Button
                  className="w-full justify-start px-0 text-gray-700 hover:!text-primary"
                  onClick={() => {
                    handleLogout();
                  }}
                  type="text"
                >
                  Cerrar sesión ({user.firstName})
                </Button>
              ) : (
                <>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleOpenLogin();
                    }}
                    type="primary"
                  >
                    Iniciar sesión
                  </Button>
                  <Link
                    className="no-underline hover:no-underline"
                    to={PATHS.register}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button block type="default">
                      Registro
                    </Button>
                  </Link>
                </>
              )}
              <Link
                className="no-underline hover:no-underline"
                to={PATHS.contact}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button block type="primary">
                  Contacto
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </div>
      <Drawer
        footer={
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center justify-between text-base font-semibold text-gray-900">
              <span>Total a pagar</span>
              <span className="tabular-nums text-primary">Bs {formattedTotalBs}</span>
            </div>
            <Button
              block
              disabled={cart.length === 0 || checkoutSyncing}
              loading={checkoutSyncing}
              type="primary"
              onClick={() => {
                if (user?.type === 'client') {
                  void (async () => {
                    setCheckoutSyncing(true);
                    const syncResult = await flushCartSync();
                    setCheckoutSyncing(false);
                    if (!syncResult.ok || !syncResult.order) {
                      void message.error(
                        syncResult.error ?? 'No se pudo sincronizar el carrito con el servidor'
                      );
                      return;
                    }
                    setCartDrawerOpen(false);
                    navigate(PATHS.checkout);
                  })();
                  return;
                }
                setCartDrawerOpen(false);
                if (!user) {
                  void message.info('Inicia sesión para continuar al checkout.');
                  return;
                }
                void message.info('Solo usuarios cliente pueden finalizar el pago.');
              }}
            >
              Ir a pagar
            </Button>
          </div>
        }
        onClose={() => setCartDrawerOpen(false)}
        open={cartDrawerOpen}
        title="Tu carrito"
        width={420}
      >
        {cart.length === 0 ? (
          <Empty className="py-[32px]" description="El carrito está vacío" />
        ) : (
          <div className="flex flex-col gap-[16px] pb-[16px]">
            {cart.map((item) => {
              const max = getMaxOrderQuantity(item.product);
              const lineTotal = item.product.price * item.quantity;
              const lineTotalBs = formatBs(lineTotal, usdRate);
              return (
                <div
                  key={item.productId}
                  className="flex gap-[12px] rounded-lg border border-gray-100 bg-gray-50/80 p-[12px]"
                >
                  <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
                    {item.product.imageUrl ? (
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={item.product.imageUrl}
                      />
                    ) : (
                      <span className="px-[8px] text-center text-xs text-gray-400">LM</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-medium text-gray-900">{item.product.name}</p>
                    {item.product.brand ? (
                      <p className="mt-[4px] text-xs text-gray-500">{item.product.brand}</p>
                    ) : null}
                    <p className="mt-[8px] text-sm tabular-nums text-primary">
                      Bs {formatBs(item.product.price, usdRate)} × {item.quantity} = Bs{' '}
                      {lineTotalBs}
                    </p>
                    <div className="mt-[12px] flex flex-wrap items-center gap-[8px]">
                      <span className="text-xs text-gray-600">Cant.</span>
                      <InputNumber
                        max={max}
                        min={1}
                        size="small"
                        value={item.quantity}
                        onChange={(v) => {
                          const n = typeof v === 'number' ? Math.trunc(v) : 1;
                          updateQuantity(item.productId, n);
                        }}
                      />
                      <Button
                        danger
                        size="small"
                        type="link"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            <Divider className="my-[8px]" />
            <Button danger type="default" onClick={() => clearCart()}>
              Vaciar carrito
            </Button>
          </div>
        )}
      </Drawer>
      <Modal
        centered
        closable
        footer={
          <div className="flex flex-col gap-[16px]">
            <Button
              block
              loading={loginLoading}
              onClick={() => void form.submit()}
              size="large"
              type="primary"
            >
              Entrar
            </Button>
            <p className="text-center text-xs text-gray-400">
              Al continuar aceptas nuestros{' '}
              <Link to={PATHS.terms} onClick={() => setLoginModalOpen(false)}>
                términos
              </Link>
            </p>
          </div>
        }
        onCancel={() => setLoginModalOpen(false)}
        open={loginModalOpen}
        title={
          <div className="pr-6">
            <h2 className="m-0 text-xl font-bold text-gray-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm font-normal text-gray-500">
              Accede a tu cuenta para continuar
            </p>
          </div>
        }
        destroyOnHidden
        width={420}
      >
        <Form form={form} layout="vertical" onFinish={handleLoginSubmit}>
          {loginError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span className="text-lg">⚠</span>
              <span>{loginError}</span>
            </div>
          )}
          <Form.Item
            label={<span className="font-medium text-gray-700">Email</span>}
            name="email"
            rules={[
              { required: true, message: 'Ingresa tu email' },
              { type: 'email', message: 'Email no válido' },
            ]}
          >
            <Input
              autoComplete="email"
              className="rounded-lg"
              placeholder="tu@email.com"
              size="large"
              onChange={() => setLoginError('')}
            />
          </Form.Item>
          <Form.Item
            label={<span className="font-medium text-gray-700">Contraseña</span>}
            name="password"
            rules={[{ required: true, message: 'Ingresa tu contraseña' }]}
          >
            <Input.Password
              autoComplete="current-password"
              className="rounded-lg"
              placeholder="••••••••"
              size="large"
              onChange={() => setLoginError('')}
            />
          </Form.Item>
        </Form>
        <div className="mt-6 border-t border-gray-100 pt-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              className="text-sm font-medium text-primary hover:text-primary/80 hover:underline"
              to={PATHS.loginCode}
              onClick={() => setLoginModalOpen(false)}
            >
              Iniciar sesión con código
            </Link>
            <Link
              className="text-sm font-medium text-primary hover:text-primary/80 hover:underline"
              to={PATHS.recoverPassword}
              onClick={() => setLoginModalOpen(false)}
            >
              ¿Olvidaste tu contraseña?
            </Link>
            <p className="text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <Link
                className="font-medium text-primary hover:underline"
                to={PATHS.register}
                onClick={() => setLoginModalOpen(false)}
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </Modal>
      <VerifyEmailLoginModal
        email={verifyModal?.email ?? ''}
        initialExpiresInSeconds={verifyModal?.codeExpiresInSeconds ?? 0}
        open={verifyModal !== null}
        onClose={() => setVerifyModal(null)}
        onContinue={handleContinueVerification}
      />
    </header>
  );
};

export default Header;
