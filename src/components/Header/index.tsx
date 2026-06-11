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
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getNotifications, markNotificationRead } from '../../api/notifications';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { connectSocket } from '../../realtime/socket';
import { theme } from '../../theme';
import { getMaxOrderQuantity } from '../../utils/cartStock';

const Header = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const { cart, cartSubtotal, clearCart, removeFromCart, totalItemCount, updateQuantity } =
    useCart();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    {
      body: string;
      createdAt: string;
      id: string;
      orderId: null | string;
      persisted: boolean;
      readAt: null | string;
      title: string;
    }[]
  >([]);
  const [form] = Form.useForm<{ email: string; password: string }>();
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

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
    if (result.error) {
      setLoginError(result.error);
      throw new Error(result.error);
    }
    setLoginModalOpen(false);
    form.resetFields();
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const formattedTotal = useMemo(
    () =>
      cartSubtotal.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [cartSubtotal]
  );
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications]
  );

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => setNotifications([]));
      return;
    }

    let cancelled = false;
    const token = localStorage.getItem('lm_market_token');

    const run = async () => {
      const response = await getNotifications(1, 20);
      if (!cancelled && response.ok && response.data?.data) {
        setNotifications(
          response.data.data.map((item) => ({
            body: item.body,
            createdAt: item.createdAt,
            id: item.id,
            orderId: item.orderId,
            persisted: true,
            readAt: item.readAt,
            title: item.title,
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
      orderId?: string;
      status?: string;
      title?: string;
      type?: string;
    }) => {
      const now = new Date().toISOString();
      const next = {
        body: payload.body ?? 'Tu orden fue actualizada',
        createdAt: now,
        id: `${now}-${Math.random().toString(16).slice(2)}`,
        orderId: payload.orderId ?? null,
        persisted: false,
        readAt: null,
        title: payload.title ?? 'Notificacion',
      };
      setNotifications((prev) => [next, ...prev].slice(0, 30));

      const status = payload.status;
      const shouldDesktop =
        status === 'preparing' || status === 'readyForDelivery' || status === 'outForDelivery';
      if (
        shouldDesktop &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        void new Notification(next.title, { body: next.body });
      }
    };

    socket.on('notification:new', onNotification);
    return () => {
      cancelled = true;
      socket.off('notification:new', onNotification);
    };
  }, [user]);

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'cuenta',
      label: (
        <Link
          className="no-underline hover:no-underline"
          to="/cuenta"
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
                to="/mis-compras"
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
              <Link className="no-underline hover:no-underline" to="/orders">
                Panel ordenes
              </Link>
            ),
          },
          {
            key: 'users',
            label: (
              <Link className="no-underline hover:no-underline" to="/users">
                Usuarios
              </Link>
            ),
          },
          {
            key: 'productos',
            label: (
              <Link className="no-underline hover:no-underline" to="/productos">
                Productos
              </Link>
            ),
          },
          {
            key: 'ofertas',
            label: (
              <Link className="no-underline hover:no-underline" to="/ofertas">
                Ofertas
              </Link>
            ),
          },
        ]
      : []),
    ...(user?.type === 'deliveryDriver'
      ? [
          {
            key: 'reparto',
            label: (
              <Link className="no-underline hover:no-underline" to="/reparto">
                Panel reparto
              </Link>
            ),
          },
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
          <Link className="flex items-center no-underline hover:no-underline" to="/">
            <img src="/logo.png" alt="LM Market" className="h-16 w-auto" />
          </Link>
          <nav className="hidden md:ml-auto md:flex md:items-center md:gap-6">
            <Link
              to="/"
              className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
            >
              Inicio
            </Link>
            <Link
              to="/nosotros"
              className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
            >
              Nosotros
            </Link>
            <Link
              to="/blog"
              className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
            >
              Blog
            </Link>
            <Link
              to="/preguntas-frecuentes"
              className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
            >
              Preguntas Frecuentes
            </Link>
            {user ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                <Button
                  type="text"
                  className="flex items-center gap-2 text-gray-700 hover:text-primary"
                >
                  <span className="hidden sm:inline">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="rounded-md bg-primary/10 px-[12px] py-[8px] text-primary">
                    Mi cuenta
                  </span>
                </Button>
              </Dropdown>
            ) : (
              <Button
                className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
                onClick={handleOpenLogin}
                type="primary"
              >
                Iniciar sesión
              </Button>
            )}
            <Link
              to="/contacto"
              className="rounded-md bg-primary px-4 py-2 text-white no-underline transition-colors hover:bg-primary/90 hover:no-underline"
            >
              Contacto
            </Link>
            {user ? (
              <Popover
                trigger="click"
                open={notificationsOpen}
                onOpenChange={setNotificationsOpen}
                content={
                  <div className="w-[320px] max-w-[80vw]">
                    {notifications.length === 0 ? (
                      <p className="m-0 text-sm text-gray-500">Sin notificaciones</p>
                    ) : (
                      <List
                        size="small"
                        dataSource={notifications}
                        renderItem={(item) => (
                          <List.Item
                            className="cursor-pointer"
                            onClick={() => {
                              if (!item.readAt) {
                                setNotifications((prev) =>
                                  prev.map((notification) =>
                                    notification.id === item.id
                                      ? { ...notification, readAt: new Date().toISOString() }
                                      : notification
                                  )
                                );
                                if (item.persisted) {
                                  void markNotificationRead(item.id);
                                }
                              }
                              setNotificationsOpen(false);
                            }}
                          >
                            <List.Item.Meta
                              title={
                                <span className="text-sm font-semibold">
                                  {item.title}
                                  {!item.readAt ? (
                                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />
                                  ) : null}
                                </span>
                              }
                              description={
                                <span className="text-xs text-gray-500">
                                  {item.body}
                                  <br />
                                  {new Date(item.createdAt).toLocaleString()}
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
                    icon={<BellOutlined className="size-5" />}
                    type="text"
                  />
                </Badge>
              </Popover>
            ) : null}
            <Badge
              color={theme.token.colorPrimary}
              count={totalItemCount}
              offset={[-4, 4]}
              size="small"
            >
              <Button
                aria-label="Carrito"
                className="!text-[28px]"
                icon={<ShoppingCartOutlined className="size-8" />}
                type="text"
                onClick={() => setCartDrawerOpen(true)}
              />
            </Badge>
          </nav>
          <div className="flex items-center gap-[8px] md:hidden">
            <Badge
              color={theme.token.colorPrimary}
              count={totalItemCount}
              offset={[-4, 4]}
              size="small"
            >
              <Button
                aria-label="Carrito"
                icon={<ShoppingCartOutlined className="size-6" />}
                size="small"
                type="text"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCartDrawerOpen(true);
                }}
              />
            </Badge>
            {user ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                <Button size="small" type="text">
                  {user.firstName}
                </Button>
              </Dropdown>
            ) : (
              <Button onClick={handleOpenLogin} size="small" type="primary">
                Entrar
              </Button>
            )}
            <Button
              aria-label="Toggle menu"
              className="md:hidden"
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
        {mobileMenuOpen && (
          <nav className="border-t border-gray-200 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <Link
                className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
                to="/"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
                to="/nosotros"
                onClick={() => setMobileMenuOpen(false)}
              >
                Nosotros
              </Link>
              <Link
                className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
                to="/blog"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                className="text-gray-700 no-underline transition-colors hover:text-primary hover:no-underline"
                to="/preguntas-frecuentes"
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
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOpenLogin();
                  }}
                  type="primary"
                >
                  Iniciar sesión
                </Button>
              )}
              <Link
                className="rounded-md bg-primary px-[16px] py-[8px] text-center text-white no-underline transition-colors hover:bg-primary/90 hover:no-underline"
                to="/contacto"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contacto
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
              <span className="tabular-nums text-primary">REF {formattedTotal}</span>
            </div>
            <Button
              block
              disabled={cart.length === 0}
              type="primary"
              onClick={() => {
                setCartDrawerOpen(false);
                if (user?.type === 'client') {
                  navigate('/checkout');
                  return;
                }
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
              const lineFmt = lineTotal.toLocaleString('es-VE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
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
                      REF {item.product.price} × {item.quantity} = REF {lineFmt}
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
              <Link to="/terminos" onClick={() => setLoginModalOpen(false)}>
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
              to="/recuperar-password"
              onClick={() => setLoginModalOpen(false)}
            >
              ¿Olvidaste tu contraseña?
            </Link>
            <p className="text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <Link
                className="font-medium text-primary hover:underline"
                to="/registro"
                onClick={() => setLoginModalOpen(false)}
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </Modal>
    </header>
  );
};

export default Header;
