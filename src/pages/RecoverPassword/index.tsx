import { Alert, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import SEO from '../../components/SEO';
import { PATHS } from '../../constants/paths';
import { useAuth } from '../../context/AuthContext';

const RecoverPassword = () => {
  const { requestPasswordReset } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form] = Form.useForm<{ email: string }>();

  const handleSubmit = async (values: { email: string }) => {
    setError('');
    setLoading(true);
    setSent(false);
    const result = await requestPasswordReset(values.email);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  };

  return (
    <>
      <SEO
        title="Recuperar contraseña"
        description="Solicita restablecer tu contraseña en LM Market."
      />
      <div className="mx-auto max-w-md px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
        <h1 className="mb-[24px] text-3xl font-bold text-gray-900">Recuperar contraseña</h1>
        {sent ? (
          <div className="flex flex-col gap-[16px]">
            <Alert
              message="Revisa tu correo"
              description="Si el email existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam."
              showIcon
              type="success"
            />
            <Link className="text-primary hover:underline" to={PATHS.login}>
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <Form
            className="flex flex-col gap-[16px]"
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
          >
            {error ? <Alert message={error} showIcon type="error" /> : null}
            <p className="text-sm text-gray-600">
              Introduce tu email y te enviaremos instrucciones para restablecer tu contraseña.
            </p>
            <Form.Item
              label="Email *"
              name="email"
              rules={[
                { required: true, message: 'El email es obligatorio' },
                { type: 'email', message: 'Ingresa un email válido' },
              ]}
            >
              <Input
                className="h-[40px] rounded border-gray-300"
                onChange={() => setError('')}
                placeholder="tu@email.com"
              />
            </Form.Item>
            <Button className="h-[40px]" htmlType="submit" loading={loading} type="primary">
              Enviar instrucciones
            </Button>
          </Form>
        )}
      </div>
    </>
  );
};

export default RecoverPassword;
