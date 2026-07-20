import { ConfigProvider } from 'antd';
import { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Layout from './components/Layout';
import OrganizationSchema from './components/OrganizationSchema';
import ProtectedRoute from './components/ProtectedRoute';
import VerifyEmailRoute from './components/VerifyEmailRoute';
import { PATHS } from './constants/paths';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ExchangeRateProvider } from './context/ExchangeRateContext';
import About from './pages/About';
import Account from './pages/Account';
import AdminBanners from './pages/AdminBanners';
import AdminBlogArticles from './pages/AdminBlogArticles';
import AdminDeals from './pages/AdminDeals';
import AdminOrdersPage from './pages/AdminOrders';
import AdminPaymentMethods from './pages/AdminPaymentMethods';
import AdminProducts from './pages/AdminProducts';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import CheckoutPage from './pages/Checkout';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Home from './pages/Home';
import Login from './pages/Login';
import LoginCode from './pages/LoginCode';
import MyOrdersPage from './pages/MyOrders';
import RecoverPassword from './pages/RecoverPassword';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import Users from './pages/Users';
import VerifyEmail from './pages/VerifyEmail';
import GlobalStyles from './styles/GlobalStyles';
import { theme } from './theme';

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
      <ConfigProvider theme={theme}>
        <GlobalStyles />
        <AuthProvider>
          <ExchangeRateProvider>
            <CartProvider>
              <BrowserRouter>
                <Layout>
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
