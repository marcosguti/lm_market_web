import { Collapse } from 'antd';
import { motion } from 'framer-motion';

import SEO from '../../components/SEO';

interface FAQItem {
  answer: string;
  question: string;
}

const FAQ = () => {
  const faqs: FAQItem[] = [
    {
      question: '¿Cómo creo una cuenta?',
      answer:
        'Para crear una cuenta en LM Market, debes registrarte en nuestro sitio web completando el formulario de registro con tus datos personales. Una vez registrado, recibirás un email de confirmación.',
    },
    {
      question: '¿Cómo ingreso a mi cuenta?',
      answer:
        'Puedes ingresar a tu cuenta usando tu correo electrónico y contraseña en la sección de inicio de sesión de nuestro sitio web.',
    },
    {
      question: '¿Qué exploradores facilitan mi navegación por la tienda virtual?',
      answer:
        'Recomendamos usar los navegadores más actualizados como Google Chrome, Mozilla Firefox, Microsoft Edge o Safari para una mejor experiencia de navegación.',
    },
  ];

  return (
    <>
      <SEO
        title="Preguntas Frecuentes"
        description="Encuentra respuestas a las preguntas más frecuentes sobre LM Market, nuestros servicios y productos."
      />
      <div className="mx-auto max-w-4xl px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-[32px] text-4xl font-bold text-gray-900"
        >
          Preguntas Frecuentes
        </motion.h1>

        <Collapse
          accordion
          bordered={false}
          className="overflow-hidden rounded-lg border border-gray-200 bg-white [&_.ant-collapse-item]:border-gray-200"
          expandIconPosition="end"
          items={faqs.map((faq, index) => ({
            children: (
              <p className="m-0 px-[8px] pb-[16px] text-gray-700 sm:px-[16px]">{faq.answer}</p>
            ),
            key: String(index),
            label: <span className="font-semibold text-gray-900">{faq.question}</span>,
          }))}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-[48px] rounded-lg bg-primary/10 p-[32px] text-center"
        >
          <p className="text-lg text-gray-700">
            Si requieres información y atención personalizada solo debes contactarte con nosotros.
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default FAQ;
