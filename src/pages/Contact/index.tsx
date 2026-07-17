import { Button, Form, Input, Select } from 'antd';
import { motion } from 'framer-motion';

import SEO from '../../components/SEO';

const areaOptions = [
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

const Contact = () => {
  const [form] = Form.useForm<{
    area: string;
    asunto: string;
    comentario: string;
    email: string;
    nombre: string;
  }>();

  const handleSubmit = (values: {
    area: string;
    asunto: string;
    comentario: string;
    email: string;
    nombre: string;
  }) => {
     
    console.log('Form submitted:', values);
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
          className="mb-[32px] text-4xl font-bold text-gray-900"
        >
          Contacto
        </motion.h1>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid gap-[32px] md:grid-cols-2"
        >
          <motion.div variants={itemVariants}>
            <h2 className="mb-[16px] text-2xl font-semibold text-gray-900">
              Información de Contacto
            </h2>
            <div className="flex flex-col gap-[16px]">
              <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300 }}>
                <h3 className="mb-[8px] font-semibold text-gray-900">Dirección</h3>
                <p className="text-gray-700">
                  CR 4A LOCAL NRO 9-173 SECTOR EL LLANO, TOVAR, MÉRIDA ZONA POSTAL 5143
                </p>
              </motion.div>
              <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300 }}>
                <h3 className="mb-[8px] font-semibold text-gray-900">Teléfono</h3>
                <a className="text-primary hover:underline" href="tel:+584121184736">
                  +58 0412-1184736
                </a>
              </motion.div>
              <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300 }}>
                <h3 className="mb-[8px] font-semibold text-gray-900">Email</h3>
                <a className="text-primary hover:underline" href="mailto:Soporte@lmmarketca.com">
                  Soporte@lmmarketca.com
                </a>
              </motion.div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Form
              className="flex flex-col gap-[16px]"
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
            >
              <Form.Item
                label="Área a comunicar"
                name="area"
                rules={[{ required: true, message: 'Selecciona un área' }]}
              >
                <Select className="h-[40px]" options={areaOptions} placeholder="Seleccione área" />
              </Form.Item>
              <Form.Item
                label="Nombre"
                name="nombre"
                rules={[{ required: true, message: 'El nombre es obligatorio' }]}
              >
                <Input className="h-[40px] rounded border-gray-300" />
              </Form.Item>
              <Form.Item
                label="Correo electrónico"
                name="email"
                rules={[
                  { required: true, message: 'El email es obligatorio' },
                  { type: 'email', message: 'Email no válido' },
                ]}
              >
                <Input
                  className="h-[40px] rounded border-gray-300"
                  placeholder="ejemplo@correo.com"
                  type="email"
                />
              </Form.Item>
              <Form.Item
                label="Asunto"
                name="asunto"
                rules={[{ required: true, message: 'El asunto es obligatorio' }]}
              >
                <Input className="h-[40px] rounded border-gray-300" />
              </Form.Item>
              <Form.Item
                label="Comentario"
                name="comentario"
                rules={[{ required: true, message: 'El comentario es obligatorio' }]}
              >
                <Input.TextArea className="rounded border-gray-300" rows={5} />
              </Form.Item>
              <Button className="h-[40px] w-full" htmlType="submit" type="primary">
                Enviar
              </Button>
            </Form>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default Contact;
