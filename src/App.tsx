import { ConfigProvider } from 'antd';
import { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import OrganizationSchema from './components/OrganizationSchema';
import ProtectedRoute from './components/ProtectedRoute';
import VerifyEmailRoute from './components/VerifyEmailRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import About from './pages/About';
import Account from './pages/Account';
import AdminBanners from './pages/AdminBanners';
import AdminDeals from './pages/AdminDeals';
import AdminOrdersPage from './pages/AdminOrders';
import AdminProducts from './pages/AdminProducts';
import Blog from './pages/Blog';
import CheckoutPage from './pages/Checkout';
import Contact from './pages/Contact';
import DeliveryOrdersPage from './pages/DeliveryOrders';
import FAQ from './pages/FAQ';
import Home from './pages/Home';
import Login from './pages/Login';
import LoginCode from './pages/LoginCode';
import MyOrdersPage from './pages/MyOrders';
import RecoverPassword from './pages/RecoverPassword';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Terms from './pages/Terms';
import Users from './pages/Users';
import GlobalStyles from './styles/GlobalStyles';
import { theme } from './theme';

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
          <CartProvider>
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/nosotros" element={<About />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/terminos" element={<Terms />} />
                  <Route path="/preguntas-frecuentes" element={<FAQ />} />
                  <Route path="/contacto" element={<Contact />} />
                  <Route path="/registro" element={<Register />} />
                  <Route path="/iniciar-sesion" element={<Login />} />
                  <Route path="/iniciar-sesion/codigo" element={<LoginCode />} />
                  <Route path="/recuperar-password" element={<RecoverPassword />} />
                  <Route
                    path="/verificar-email"
                    element={
                      <VerifyEmailRoute>
                        <VerifyEmail />
                      </VerifyEmailRoute>
                    }
                  />
                  <Route path="/restablecer-password" element={<ResetPassword />} />
                  <Route
                    path="/cuenta"
                    element={
                      <ProtectedRoute>
                        <Account />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute allowedTypes={['client']}>
                        <CheckoutPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/mis-compras"
                    element={
                      <ProtectedRoute allowedTypes={['client']}>
                        <MyOrdersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute allowedTypes={['admin', 'superAdmin']}>
                        <AdminOrdersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute allowedTypes={['admin', 'superAdmin']}>
                        <Users />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/productos"
                    element={
                      <ProtectedRoute allowedTypes={['admin', 'superAdmin']}>
                        <AdminProducts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ofertas"
                    element={
                      <ProtectedRoute allowedTypes={['admin', 'superAdmin']}>
                        <AdminDeals />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/banners"
                    element={
                      <ProtectedRoute allowedTypes={['admin', 'superAdmin']}>
                        <AdminBanners />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reparto"
                    element={
                      <ProtectedRoute allowedTypes={['deliveryDriver']}>
                        <DeliveryOrdersPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Layout>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ConfigProvider>
    </HelmetProvider>
  );
}

export default App;
