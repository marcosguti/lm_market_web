import { Alert, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form] = Form.useForm<{ confirmPassword: string; newPassword: string }>();

  const handleSubmit = async (values: { confirmPassword: string; newPassword: string }) => {
    setError('');
    setLoading(true);
    const result = await resetPassword(token, values.newPassword);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate('/iniciar-sesion'), 3000);
  };

  if (!token) {
    return (
      <>
        <SEO
          title="Restablecer contraseña"
          description="Restablece tu contraseña en LM Market."
        />
        <div className="mx-auto max-w-md px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
          <h1 className="mb-[24px] text-3xl font-bold text-gray-900">Restablecer contraseña</h1>
          <Alert
            className="mb-[16px]"
            message="Enlace inválido"
            description="El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo."
            showIcon
            type="error"
          />
          <Link className="text-primary hover:underline" to="/recuperar-password">
            Solicitar nuevo enlace
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Restablecer contraseña"
        description="Elige una nueva contraseña para tu cuenta en LM Market."
      />
      <div className="mx-auto max-w-md px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
        <h1 className="mb-[24px] text-3xl font-bold text-gray-900">Nueva contraseña</h1>
        {success ? (
          <div className="flex flex-col gap-[16px]">
            <Alert
              message="Contraseña actualizada"
              description="Tu contraseña se actualizó correctamente. Serás redirigido al inicio de sesión."
              showIcon
              type="success"
            />
            <Link className="text-primary hover:underline" to="/iniciar-sesion">
              Ir a iniciar sesión
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
              Introduce tu nueva contraseña. Debe tener al menos 8 caracteres e incluir mayúsculas,
              minúsculas y números.
            </p>
            <Form.Item
              label="Nueva contraseña *"
              name="newPassword"
              rules={[
                { required: true, message: 'Requerido' },
                { min: 8, message: 'Mínimo 8 caracteres' },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                  message: 'Debe incluir mayúsculas, minúsculas y números',
                },
              ]}
            >
              <Input.Password
                className="h-[40px] rounded border-gray-300"
                onChange={() => setError('')}
              />
            </Form.Item>
            <Form.Item
              dependencies={['newPassword']}
              label="Confirmar nueva contraseña *"
              name="confirmPassword"
              rules={[
                { required: true, message: 'Requerido' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
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
        )}
        <p className="mt-[16px] text-center text-sm text-gray-600">
          <Link className="text-primary hover:underline" to="/recuperar-password">
            Solicitar nuevo enlace
          </Link>
        </p>
      </div>
    </>
  );
};

export default ResetPassword;
