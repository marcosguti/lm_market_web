import { EnvironmentOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Select } from 'antd';
import { motion } from 'framer-motion';
import { useState } from 'react';

import {
  CONTACT_AREAS,
  CONTACT_LIMITS,
  type ContactArea,
  sendContactMessage,
} from '../../api/contact';
import SEO from '../../components/SEO';

const areaOptions: { label: string; value: ContactArea }[] = [
  { label: 'Contacto', value: 'contacto' },
  { label: 'Ventas', value: 'ventas' },
  { label: 'Mercadeo', value: 'mercadeo' },
  { label: 'Talento Humano', value: 'talento-humano' },
  { label: 'Soporte', value: 'soporte' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

type ContactFormValues = {
  area: ContactArea;
  email: string;
  message: string;
  name: string;
  subject: string;
};

const Contact = () => {
  const [form] = Form.useForm<ContactFormValues>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (values: ContactFormValues) => {
    setError('');
    setSent(false);
    setLoading(true);
    const result = await sendContactMessage({
      area: values.area,
      email: values.email.trim().toLowerCase(),
      message: values.message.trim(),
      name: values.name.trim(),
      subject: values.subject.trim(),
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.data?.error ?? 'No se pudo enviar el mensaje. Inténtalo de nuevo más tarde.');
      return;
    }
    setSent(true);
    form.resetFields();
  };

  return (
    <>
      <SEO
        title="Contacto"
        description="Contáctanos en LM Market. Estamos aquí para ayudarte con cualquier consulta o solicitud."
      />
      <div className="mx-auto max-w-4xl px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-[16px] text-4xl font-bold text-gray-900"
        >
          Contacto
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-[32px] text-lg text-gray-600"
        >
          Escríbenos y te respondemos a la brevedad.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid gap-[32px] md:grid-cols-2"
        >
          <motion.div variants={itemVariants} className="flex flex-col gap-[24px]">
            <h2 className="text-2xl font-semibold text-gray-900">Información de Contacto</h2>
            <div className="flex flex-col gap-[20px]">
              <div className="flex gap-[12px]">
                <EnvironmentOutlined className="mt-[4px] text-lg text-primary" aria-hidden />
                <div>
                  <p className="mb-[4px] text-sm font-medium text-gray-500">Dirección</p>
                  <p className="text-gray-900">
                    CR 4A LOCAL NRO 9-173 SECTOR EL LLANO, TOVAR, MÉRIDA ZONA POSTAL 5143
                  </p>
                </div>
              </div>
              <div className="flex gap-[12px]">
                <PhoneOutlined className="mt-[4px] text-lg text-primary" aria-hidden />
                <div>
                  <p className="mb-[4px] text-sm font-medium text-gray-500">Teléfono</p>
                  <a
                    className="text-gray-900 hover:text-primary hover:underline"
                    href="tel:+584121184736"
                  >
                    +58 0412-1184736
                  </a>
                </div>
              </div>
              <div className="flex gap-[12px]">
                <MailOutlined className="mt-[4px] text-lg text-primary" aria-hidden />
                <div>
                  <p className="mb-[4px] text-sm font-medium text-gray-500">Email</p>
                  <a
                    className="text-gray-900 hover:text-primary hover:underline"
                    href="mailto:Soporte@lmmarketca.com"
                  >
                    Soporte@lmmarketca.com
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="rounded-lg border border-gray-200 bg-white p-[24px]">
              {sent ? (
                <Alert
                  className="mb-[16px]"
                  description="Tu mensaje fue enviado. Te responderemos a la brevedad."
                  message="Mensaje enviado"
                  showIcon
                  type="success"
                />
              ) : null}
              {error ? <Alert className="mb-[16px]" message={error} showIcon type="error" /> : null}
              <Form
                className="flex flex-col gap-[8px]"
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
              >
                <Form.Item
                  label="Área a comunicar *"
                  name="area"
                  rules={[
                    { required: true, message: 'Selecciona un área' },
                    {
                      type: 'enum',
                      enum: CONTACT_AREAS,
                      message: 'Selecciona un área válida',
                    },
                  ]}
                >
                  <Select
                    className="h-[40px]"
                    options={areaOptions}
                    placeholder="Seleccione área"
                  />
                </Form.Item>
                <Form.Item
                  label="Nombre *"
                  name="name"
                  rules={[
                    { required: true, message: 'El nombre es obligatorio' },
                    {
                      min: CONTACT_LIMITS.nameMin,
                      message: `El nombre debe tener al menos ${CONTACT_LIMITS.nameMin} caracteres`,
                    },
                    {
                      max: CONTACT_LIMITS.nameMax,
                      message: `El nombre no puede superar ${CONTACT_LIMITS.nameMax} caracteres`,
                    },
                  ]}
                  normalize={(value: string) => value?.trimStart()}
                >
                  <Input
                    className="h-[40px] rounded border-gray-300"
                    maxLength={CONTACT_LIMITS.nameMax}
                    onChange={() => setError('')}
                  />
                </Form.Item>
                <Form.Item
                  label="Correo electrónico *"
                  name="email"
                  rules={[
                    { required: true, message: 'El email es obligatorio' },
                    { type: 'email', message: 'Email no válido' },
                  ]}
                >
                  <Input
                    className="h-[40px] rounded border-gray-300"
                    onChange={() => setError('')}
                    placeholder="ejemplo@correo.com"
                    type="email"
                  />
                </Form.Item>
                <Form.Item
                  label="Asunto *"
                  name="subject"
                  rules={[
                    { required: true, message: 'El asunto es obligatorio' },
                    {
                      min: CONTACT_LIMITS.subjectMin,
                      message: `El asunto debe tener al menos ${CONTACT_LIMITS.subjectMin} caracteres`,
                    },
                    {
                      max: CONTACT_LIMITS.subjectMax,
                      message: `El asunto no puede superar ${CONTACT_LIMITS.subjectMax} caracteres`,
                    },
                  ]}
                >
                  <Input
                    className="h-[40px] rounded border-gray-300"
                    maxLength={CONTACT_LIMITS.subjectMax}
                    onChange={() => setError('')}
                  />
                </Form.Item>
                <Form.Item
                  label="Mensaje *"
                  name="message"
                  rules={[
                    { required: true, message: 'El mensaje es obligatorio' },
                    {
                      min: CONTACT_LIMITS.messageMin,
                      message: `El mensaje debe tener al menos ${CONTACT_LIMITS.messageMin} caracteres`,
                    },
                    {
                      max: CONTACT_LIMITS.messageMax,
                      message: `El mensaje no puede superar ${CONTACT_LIMITS.messageMax} caracteres`,
                    },
                  ]}
                >
                  <Input.TextArea
                    className="rounded border-gray-300"
                    maxLength={CONTACT_LIMITS.messageMax}
                    onChange={() => setError('')}
                    rows={5}
                    showCount
                  />
                </Form.Item>
                <Button
                  className="mt-[8px] h-[40px] w-full"
                  htmlType="submit"
                  loading={loading}
                  type="primary"
                >
                  Enviar
                </Button>
              </Form>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default Contact;
