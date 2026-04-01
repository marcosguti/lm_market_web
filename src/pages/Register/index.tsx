import { Alert, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<{
    email: string;
    firstName: string;
    lastName: string;
    numberId: string;
    password: string;
  }>();

  const handleSubmit = async (values: {
    email: string;
    firstName: string;
    lastName: string;
    numberId: string;
    password: string;
  }) => {
    setError('');
    setLoading(true);
    const result = await register({
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      numberId: values.numberId,
      password: values.password,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <>
      <SEO title="Registro" description="Crea tu cuenta en LM Market." />
      <div className="mx-auto max-w-md px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
        <h1 className="mb-[24px] text-3xl font-bold text-gray-900">Registro</h1>
        <Form
          className="flex flex-col gap-[16px]"
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          {error ? <Alert message={error} showIcon type="error" /> : null}
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
              type="email"
            />
          </Form.Item>
          <Form.Item
            label="Nombre *"
            name="firstName"
            rules={[{ required: true, message: 'El nombre es obligatorio' }]}
          >
            <Input className="h-[40px] rounded border-gray-300" onChange={() => setError('')} />
          </Form.Item>
          <Form.Item
            label="Apellido *"
            name="lastName"
            rules={[{ required: true, message: 'El apellido es obligatorio' }]}
          >
            <Input className="h-[40px] rounded border-gray-300" onChange={() => setError('')} />
          </Form.Item>
          <Form.Item
            label="Cédula / Número de identificación *"
            name="numberId"
            rules={[{ required: true, message: 'Este campo es obligatorio' }]}
          >
            <Input className="h-[40px] rounded border-gray-300" onChange={() => setError('')} />
          </Form.Item>
          <Form.Item
            label="Contraseña * (mínimo 6 caracteres)"
            name="password"
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
          <Button className="h-[40px]" htmlType="submit" loading={loading} type="primary">
            Registrarme
          </Button>
        </Form>
        <p className="mt-[16px] text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link className="text-primary hover:underline" to="/iniciar-sesion">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </>
  );
};

export default Register;
