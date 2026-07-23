import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import { lazy, Suspense, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Layout from './components/Layout';
import Loader from './components/Loader';
import OrganizationSchema from './components/OrganizationSchema';
import ProtectedRoute from './components/ProtectedRoute';
import VerifyEmailRoute from './components/VerifyEmailRoute';
import { PATHS } from './constants/paths';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ExchangeRateProvider } from './context/ExchangeRateContext';
import Home from './pages/Home';
import GlobalStyles from './styles/GlobalStyles';
import { theme } from './theme';

const About = lazy(() => import('./pages/About'));
const Account = lazy(() => import('./pages/Account'));
const AdminBanners = lazy(() => import('./pages/AdminBanners'));
const AdminBlogArticles = lazy(() => import('./pages/AdminBlogArticles'));
const AdminDeals = lazy(() => import('./pages/AdminDeals'));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrders'));
const AdminPaymentMethods = lazy(() => import('./pages/AdminPaymentMethods'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const AdminSyncStatus = lazy(() => import('./pages/AdminSyncStatus'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const CheckoutPage = lazy(() => import('./pages/Checkout'));
const Contact = lazy(() => import('./pages/Contact'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Login = lazy(() => import('./pages/Login'));
const LoginCode = lazy(() => import('./pages/LoginCode'));
const MyOrdersPage = lazy(() => import('./pages/MyOrders'));
const RecoverPassword = lazy(() => import('./pages/RecoverPassword'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Terms = lazy(() => import('./pages/Terms'));
const Users = lazy(() => import('./pages/Users'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

function LegacyRedirect({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}${location.hash}`} replace state={location.state} />;
}

function App() {
  useEffect(() => {
    const loader = document.getElementById('initial-loader-container');
    const rootEl = document.getElementById('root');
    loader?.remove();
    if (rootEl) {
      rootEl.style.removeProperty('display');
    }
  }, []);

  return (
    <HelmetProvider>
      <OrganizationSchema />
      <ConfigProvider locale={esES} theme={theme}>
        <GlobalStyles />
        <AuthProvider>
          <ExchangeRateProvider>
            <CartProvider>
              <BrowserRouter>
                <Layout>
                  <Suspense fallback={<Loader />}>
                    <Routes>
                      <Route path={PATHS.home} element={<Home />} />
                      <Route path={PATHS.about} element={<About />} />
                      <Route path={PATHS.blog} element={<Blog />} />
                      <Route path={`${PATHS.blog}/:id`} element={<BlogDetail />} />
                      <Route path={PATHS.terms} element={<Terms />} />
                      <Route path={PATHS.faq} element={<FAQ />} />
                      <Route path={PATHS.contact} element={<Contact />} />
                      <Route path={PATHS.register} element={<Register />} />
                      <Route path={PATHS.login} element={<Login />} />
                      <Route path={PATHS.loginCode} element={<LoginCode />} />
                      <Route path={PATHS.recoverPassword} element={<RecoverPassword />} />
                      <Route
                        path={PATHS.verifyEmail}
                        element={
                          <VerifyEmailRoute>
                            <VerifyEmail />
                          </VerifyEmailRoute>
                        }
                      />
                      <Route path={PATHS.resetPassword} element={<ResetPassword />} />
                      <Route
                        path={PATHS.account}
                        element={
                          <ProtectedRoute>
                            <Account />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={PATHS.checkout}
                        element={
                          <ProtectedRoute allowedTypes={['client']}>
                            <CheckoutPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={PATHS.myOrders}
                        element={
                          <ProtectedRoute allowedTypes={['client']}>
                            <MyOrdersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={PATHS.orders}
                        element={
                          <ProtectedRoute allowedTypes={['admin', 'superAdmin']}>
                            <AdminOrdersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={PATHS.users}
                        element={
                          <ProtectedRoute allowedTypes={['admin', 'superAdmin']}>
                            <Users />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={PATHS.products}
                        element={
                          <ProtectedRoute allowedTypes={['admin', 'superAdmin']}>
                            <AdminProducts />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={PATHS.deals}
                        element={
                          <ProtectedRoute allowedTypes={['admin', 'superAdmin']}>
                            <AdminDeals />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={PATHS.banners}
                        element={
                          <ProtectedRoute allowedTypes={['admin', 'superAdmin']}>
                            <AdminBanners />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={PATHS.blogArticlesAdmin}
                        element={
                          <ProtectedRoute allowedTypes={['admin', 'superAdmin']}>
                            <AdminBlogArticles />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={PATHS.paymentMethods}
                        element={
                          <ProtectedRoute allowedTypes={['superAdmin']}>
                            <AdminPaymentMethods />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={PATHS.syncStatus}
                        element={
                          <ProtectedRoute allowedTypes={['superAdmin']}>
                            <AdminSyncStatus />
                          </ProtectedRoute>
                        }
                      />
                      {/* Legacy English / hybrid path redirects */}
                      <Route
                        path="/checkout"
                        element={<LegacyRedirect to={PATHS.checkout} />}
                      />
                      <Route path="/orders" element={<LegacyRedirect to={PATHS.orders} />} />
                      <Route path="/users" element={<LegacyRedirect to={PATHS.users} />} />
                      <Route path="/banners" element={<LegacyRedirect to={PATHS.banners} />} />
                      <Route
                        path="/blog-articles-admin"
                        element={<LegacyRedirect to={PATHS.blogArticlesAdmin} />}
                      />
                      <Route
                        path="/recuperar-password"
                        element={<LegacyRedirect to={PATHS.recoverPassword} />}
                      />
                      <Route
                        path="/verificar-email"
                        element={<LegacyRedirect to={PATHS.verifyEmail} />}
                      />
                      <Route
                        path="/restablecer-password"
                        element={<LegacyRedirect to={PATHS.resetPassword} />}
                      />
                    </Routes>
                  </Suspense>
                </Layout>
              </BrowserRouter>
            </CartProvider>
          </ExchangeRateProvider>
        </AuthProvider>
      </ConfigProvider>
    </HelmetProvider>
  );
}

export default App;
