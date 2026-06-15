import { Alert, Button, Form, Input } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';

const Account = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [profileForm] = Form.useForm<{
    address: string;
    firstName: string;
    lastName: string;
    phone: string;
  }>();
  const [passwordForm] = Form.useForm<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>();
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        address: user.address ?? '',
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? '',
      });
    }
  }, [user, profileForm]);

  const handleProfileSubmit = async () => {
    setProfileError('');
    setProfileSuccess(false);
    const values = await profileForm.validateFields().catch(() => null);
    if (!values) return;
    setProfileSaving(true);
    const result = await updateProfile({
      address: values.address || undefined,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || undefined,
    });
    setProfileSaving(false);
    if (result.error) {
      setProfileError(result.error);
      return;
    }
    setProfileSuccess(true);
  };

  const handlePasswordSubmit = async () => {
    setPasswordError('');
    setPasswordSuccess(false);
    const values = await passwordForm.validateFields().catch(() => null);
    if (!values) return;
    setPasswordSaving(true);
    const result = await changePassword(values.currentPassword, values.newPassword);
    setPasswordSaving(false);
    if (result.error) {
      setPasswordError(result.error);
      return;
    }
    setPasswordSuccess(true);
    passwordForm.resetFields();
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <SEO title="Mi cuenta" description="Gestiona tu perfil y contraseña en LM Market." />
      <div className="mx-auto max-w-2xl px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
        <h1 className="mb-[32px] text-3xl font-bold text-gray-900">Mi cuenta</h1>
        <section className="mb-[40px]">
          <h2 className="mb-[16px] text-xl font-semibold text-gray-800">Datos personales</h2>
          <Form form={profileForm} layout="vertical" onFinish={handleProfileSubmit}>
            {profileError ? (
              <Alert className="mb-[16px]" message={profileError} showIcon type="error" />
            ) : null}
            {profileSuccess ? (
              <Alert
                className="mb-[16px]"
                message="Datos actualizados correctamente."
                showIcon
                type="success"
              />
            ) : null}
            <Form.Item label="Email">
              <Input disabled value={user.email} />
            </Form.Item>
            <Form.Item label="Identificación (cédula)">
              <Input disabled value={user.numberId} />
            </Form.Item>
            <Form.Item
              label="Nombre"
              name="firstName"
              rules={[{ required: true, message: 'Requerido' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Apellido"
              name="lastName"
              rules={[{ required: true, message: 'Requerido' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Teléfono" name="phone">
              <Input />
            </Form.Item>
            <Form.Item label="Dirección" name="address">
              <Input />
            </Form.Item>
            <Form.Item>
              <Button htmlType="submit" loading={profileSaving} type="primary">
                Guardar cambios
              </Button>
            </Form.Item>
          </Form>
        </section>
        <section>
          <h2 className="mb-[16px] text-xl font-semibold text-gray-800">Cambiar contraseña</h2>
          <Form form={passwordForm} layout="vertical" onFinish={handlePasswordSubmit}>
            {passwordError ? (
              <Alert className="mb-[16px]" message={passwordError} showIcon type="error" />
            ) : null}
            {passwordSuccess ? (
              <Alert
                className="mb-[16px]"
                message="Contraseña actualizada correctamente."
                showIcon
                type="success"
              />
            ) : null}
            <Form.Item
              label="Contraseña actual"
              name="currentPassword"
              rules={[{ required: true, message: 'Requerido' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              label="Nueva contraseña"
              name="newPassword"
              rules={[
                { required: true, message: 'Requerido' },
                { min: 8, message: 'Mínimo 8 caracteres' },
                { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, message: 'Debe incluir mayúsculas, minúsculas y números' },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              label="Confirmar nueva contraseña"
              name="confirmPassword"
              dependencies={['newPassword']}
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
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button htmlType="submit" loading={passwordSaving} type="primary">
                Cambiar contraseña
              </Button>
            </Form.Item>
          </Form>
        </section>
        <p className="mt-[24px] text-sm text-gray-500">
          <Link className="text-primary hover:underline" to="/">
            Volver al inicio
          </Link>
        </p>
      </div>
    </>
  );
};

export default Account;
