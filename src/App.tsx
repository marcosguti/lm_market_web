import { ConfigProvider } from 'antd';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import About from './pages/About';
import Account from './pages/Account';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Home from './pages/Home';
import Login from './pages/Login';
import RecoverPassword from './pages/RecoverPassword';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import GlobalStyles from './styles/GlobalStyles';
import { theme } from './theme';

function App() {
  return (
    <HelmetProvider>
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
                  <Route path="/recuperar-password" element={<RecoverPassword />} />
                  <Route path="/restablecer-password" element={<ResetPassword />} />
                  <Route
                    path="/cuenta"
                    element={
                      <ProtectedRoute>
                        <Account />
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
