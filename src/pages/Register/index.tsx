import { Alert, Button, Form, Input, Select } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import PhoneInput from '../../components/PhoneInput';
import SEO from '../../components/SEO';
import { PATHS } from '../../constants/paths';
import { useAuth } from '../../context/AuthContext';
import { isValidPersonName } from '../../utils/personName';
import { isValidPhone } from '../../utils/phone';

const NUMBER_ID_TYPE_OPTIONS = [
  { label: 'V', value: 'V' },
  { label: 'E', value: 'E' },
  { label: 'P', value: 'P' },
  { label: 'J', value: 'J' },
];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<{
    email: string;
    firstName: string;
    lastName: string;
    numberIdType: string;
    numberId: string;
    password: string;
    phone?: string;
  }>();

  const handleSubmit = async (values: {
    email: string;
    firstName: string;
    lastName: string;
    numberIdType: string;
    numberId: string;
    password: string;
    phone?: string;
  }) => {
    setError('');
    setLoading(true);
    const result = await register({
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      numberIdType: values.numberIdType,
      numberId: values.numberId,
      password: values.password,
      phone: values.phone,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigate(PATHS.verifyEmail, {
      replace: true,
      state: {
        codeExpiresInSeconds: result.codeExpiresInSeconds,
        codeSent: result.codeSent ?? true,
        email: result.email ?? values.email,
        verificationContext: 'register',
      },
    });
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
            label="Correo electrónico *"
            name="email"
            rules={[
              { required: true, message: 'El correo es obligatorio' },
              { type: 'email', message: 'Ingresa un correo válido' },
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
            rules={[
              { required: true, message: 'El nombre es obligatorio' },
              {
                validator: async (_, value?: string) => {
                  if (!value?.trim()) return;
                  if (!isValidPersonName(value)) {
                    throw new Error('Solo puede contener letras');
                  }
                },
              },
            ]}
          >
            <Input className="h-[40px] rounded border-gray-300" onChange={() => setError('')} />
          </Form.Item>
          <Form.Item
            label="Apellido *"
            name="lastName"
            rules={[
              { required: true, message: 'El apellido es obligatorio' },
              {
                validator: async (_, value?: string) => {
                  if (!value?.trim()) return;
                  if (!isValidPersonName(value)) {
                    throw new Error('Solo puede contener letras');
                  }
                },
              },
            ]}
          >
            <Input className="h-[40px] rounded border-gray-300" onChange={() => setError('')} />
          </Form.Item>
          <div className="flex items-start gap-[12px]">
            <Form.Item
              label="Tipo ID"
              name="numberIdType"
              rules={[{ required: true, message: 'Selecciona el tipo' }]}
              className="mb-0 w-[90px] shrink-0"
            >
              <Select
                className="h-[40px]"
                options={NUMBER_ID_TYPE_OPTIONS}
                placeholder="Tipo"
                onChange={() => setError('')}
              />
            </Form.Item>
            <Form.Item
              label="Cédula / Número de identificación *"
              name="numberId"
              rules={[{ required: true, message: 'Este campo es obligatorio' }]}
              className="flex-1"
            >
              <Input className="h-[40px] rounded border-gray-300" onChange={() => setError('')} />
            </Form.Item>
          </div>
          <Form.Item
            label="Teléfono (opcional)"
            name="phone"
            rules={[
              {
                validator: async (_, value?: string) => {
                  if (!value) return;
                  if (!isValidPhone(value)) {
                    throw new Error('Ingresa un teléfono válido');
                  }
                },
              },
            ]}
          >
            <PhoneInput />
          </Form.Item>
          <Form.Item
            label="Contraseña * (mínimo 8 caracteres, incluir mayúsculas, minúsculas y números)"
            name="password"
            rules={[
              { required: true, message: 'La contraseña es obligatoria' },
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
          <Button className="h-[40px]" htmlType="submit" loading={loading} type="primary">
            Registrarme
          </Button>
        </Form>
        <p className="mt-[16px] text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link className="text-primary hover:underline" to={PATHS.login}>
            Iniciar sesión
          </Link>
        </p>
      </div>
    </>
  );
};

export default Register;
