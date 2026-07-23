import { Alert, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import type { EmailVerificationLocationState } from '../../types/emailVerification';

import SEO from '../../components/SEO';
import VerifyEmailLoginModal from '../../components/VerifyEmailLoginModal';
import { PATHS } from '../../constants/paths';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? PATHS.home;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyModal, setVerifyModal] = useState<{
    codeExpiresInSeconds: number;
    email: string;
  } | null>(null);
  const [form] = Form.useForm<{ email: string; password: string }>();

  const handleSubmit = async (values: { email: string; password: string }) => {
    setError('');
    setLoading(true);
    const result = await login(values.email, values.password);
    setLoading(false);
    if (result.code === 'EMAIL_NOT_VERIFIED') {
      setVerifyModal({
        codeExpiresInSeconds: result.codeExpiresInSeconds ?? 0,
        email: result.email ?? values.email,
      });
      return;
    }
    if (result.error) {
      setError(result.error);
      return;
    }
    navigate(from, { replace: true });
  };

  const handleContinueVerification = (state: EmailVerificationLocationState) => {
    setVerifyModal(null);
    navigate(PATHS.verifyEmail, { replace: true, state });
  };

  return (
    <>
      <SEO title="Iniciar sesión" description="Inicia sesión en LM Market." />
      <div className="mx-auto max-w-md px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
        <h1 className="mb-[24px] text-3xl font-bold text-gray-900">Iniciar sesión</h1>
        <Form
          className="flex flex-col gap-[16px]"
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          {error ? <Alert message={error} showIcon type="error" /> : null}
          <Form.Item
            label="Correo electrónico *"
            name="email"
            rules={[
              { required: true, message: 'El correo es obligatorio' },
              { type: 'email', message: 'Ingresa un correo válido' },
            ]}
          >
            <Input
              className="h-[40px] rounded border-gray-300"
              onChange={() => {
                setError('');
              }}
              placeholder="tu@email.com"
            />
          </Form.Item>
          <Form.Item
            label="Contraseña *"
            name="password"
            rules={[{ required: true, message: 'La contraseña es obligatoria' }]}
          >
            <Input.Password
              className="h-[40px] rounded border-gray-300"
              onChange={() => {
                setError('');
              }}
              placeholder="Tu contraseña"
            />
          </Form.Item>
          <Button className="h-[40px]" htmlType="submit" loading={loading} type="primary">
            Entrar
          </Button>
        </Form>
        <p className="mt-[16px] text-center text-sm text-gray-600">
          <Link className="text-primary hover:underline" to={PATHS.loginCode}>
            Iniciar sesión con código
          </Link>
        </p>
        <p className="mt-[8px] text-center text-sm text-gray-600">
          <Link className="text-primary hover:underline" to={PATHS.recoverPassword}>
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
        <p className="mt-[8px] text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link className="text-primary hover:underline" to={PATHS.register}>
            Regístrate
          </Link>
        </p>
      </div>
      <VerifyEmailLoginModal
        email={verifyModal?.email ?? ''}
        initialExpiresInSeconds={verifyModal?.codeExpiresInSeconds ?? 0}
        open={verifyModal !== null}
        onClose={() => setVerifyModal(null)}
        onContinue={handleContinueVerification}
      />
    </>
  );
};

export default Login;
