import { Collapse } from 'antd';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import SEO from '../../components/SEO';
import { PATHS } from '../../constants/paths';
import faqs from './faqs.json';

interface FAQItem {
  answer: string;
  question: string;
}

const FAQ = () => {
  const items = faqs as FAQItem[];

  return (
    <>
      <SEO
        title="Preguntas Frecuentes"
        description="Respuestas sobre cuenta, pedidos, entregas en Mérida y Tovar, pagos y seguimiento en LM Market."
      />
      <div className="mx-auto max-w-4xl px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-[16px] text-4xl font-bold text-gray-900"
        >
          Preguntas Frecuentes
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-[32px] text-lg text-gray-600"
        >
          Todo lo esencial para comprar en LM Market: cuenta, dirección, pagos y seguimiento de tu
          pedido.
        </motion.p>

        <Collapse
          accordion
          bordered={false}
          className="overflow-hidden rounded-lg border border-gray-200 bg-white [&_.ant-collapse-item]:border-gray-200"
          expandIconPlacement="end"
          items={items.map((faq, index) => ({
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
          <p className="mb-[8px] text-lg text-gray-700">
            ¿No encontraste lo que buscabas? Escríbenos y te ayudamos.
          </p>
          <Link to={PATHS.contact} className="font-semibold text-primary hover:underline">
            Ir a Contacto
          </Link>
        </motion.div>
      </div>
    </>
  );
};

export default FAQ;
