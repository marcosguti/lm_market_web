import { Alert, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form] = Form.useForm<{ confirmPassword: string; newPassword: string }>();

  const handleSubmit = async (values: { confirmPassword: string; newPassword: string }) => {
    setError('');
    if (!token) {
      setError('Falta el token de restablecimiento. Usa el enlace del correo.');
      return;
    }
    setLoading(true);
    const result = await resetPassword(token, values.newPassword);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate('/iniciar-sesion', { replace: true }), 2000);
  };

  if (!token && !success) {
    return (
      <>
        <SEO title="Restablecer contraseña" description="Restablece tu contraseña en LM Market." />
        <div className="mx-auto max-w-md px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
          <h1 className="mb-[24px] text-3xl font-bold text-gray-900">Restablecer contraseña</h1>
          <Alert
            className="mb-[16px]"
            message="Enlace incompleto"
            description="Falta el token. Por favor, usa el enlace que te enviamos por email."
            showIcon
            type="warning"
          />
          <Link className="text-primary hover:underline" to="/recuperar-password">
            Solicitar nuevo enlace
          </Link>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <SEO title="Contraseña actualizada" description="Tu contraseña ha sido restablecida." />
        <div className="mx-auto max-w-md px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
          <Alert
            message="Contraseña actualizada correctamente."
            description="Redirigiendo a iniciar sesión..."
            showIcon
            type="success"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Restablecer contraseña"
        description="Introduce tu nueva contraseña en LM Market."
      />
      <div className="mx-auto max-w-md px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
        <h1 className="mb-[24px] text-3xl font-bold text-gray-900">Nueva contraseña</h1>
        <Form
          className="flex flex-col gap-[16px]"
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          {error ? <Alert message={error} showIcon type="error" /> : null}
          <Form.Item
            label="Nueva contraseña * (mínimo 6 caracteres)"
            name="newPassword"
            rules={[
              { required: true, message: 'La contraseña es obligatoria' },
              { min: 6, message: 'Mínimo 6 caracteres' },
            ]}
          >
            <Input.Password
              className="h-[40px] rounded border-gray-300"
              onChange={() => setError('')}
            />
          </Form.Item>
          <Form.Item
            label="Confirmar contraseña *"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Confirma tu contraseña' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Las contraseñas no coinciden'));
                },
              }),
            ]}
          >
            <Input.Password
              className="h-[40px] rounded border-gray-300"
              onChange={() => setError('')}
            />
          </Form.Item>
          <Button className="h-[40px]" htmlType="submit" loading={loading} type="primary">
            Restablecer contraseña
          </Button>
        </Form>
        <p className="mt-[16px] text-center text-sm text-gray-600">
          <Link className="text-primary hover:underline" to="/iniciar-sesion">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </>
  );
};

export default ResetPassword;
