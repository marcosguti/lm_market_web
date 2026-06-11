import { Button } from 'antd';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { useState } from 'react';

import Carousel from '../../components/Carousel';
import DealBannerModal from '../../components/DealBannerModal';
import SEO from '../../components/SEO';
import ProductsCatalog from './ProductsCatalog';

const DEALS_SESSION_KEY = 'lm_deals_banner_dismissed';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

const Home = () => {
  const [showDeals, setShowDeals] = useState(
    () => sessionStorage.getItem(DEALS_SESSION_KEY) !== '1'
  );

  const handleCloseDeals = () => {
    sessionStorage.setItem(DEALS_SESSION_KEY, '1');
    setShowDeals(false);
  };

  return (
    <>
      <AnimatePresence>
        {showDeals && (
          <DealBannerModal onClose={handleCloseDeals} onEmpty={() => setShowDeals(false)} />
        )}
      </AnimatePresence>
      <SEO
        title="Inicio"
        description="LM Market - Tu supermercado de confianza. Productos de excelente calidad al mejor precio. Ofertas especiales y atención personalizada."
      />
      <Carousel />
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full bg-gradient-to-r from-primary to-primary/80 text-center text-white"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto max-w-7xl px-[16px] py-[32px] sm:px-[24px] md:py-[48px] lg:px-[32px]"
        >
          <h1 className="mb-[16px] text-3xl font-bold md:text-4xl lg:text-5xl">
            Bienvenido a LM Market
          </h1>
          <p className="mx-auto max-w-2xl text-base md:text-lg">
            Calidad al mejor precio. Tu supermercado de confianza, Mérida.
          </p>
        </motion.div>
      </motion.section>
      <div className="mx-auto w-full max-w-[1500px] py-[32px] sm:py-[40px]">
        <ProductsCatalog />
      </div>
      <div className="mx-auto max-w-7xl px-[16px] py-[32px] sm:px-[24px] lg:px-[32px]">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="mb-[48px]"
        >
          <motion.h2 variants={itemVariants} className="mb-[24px] text-3xl font-bold text-gray-900">
            Ofertas especiales
          </motion.h2>
          <div className="grid gap-[24px] md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -4 }}
                className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg"
              >
                <div className="h-[192px] bg-gray-200"></div>
                <div className="p-[24px]">
                  <h3 className="mb-[8px] text-xl font-semibold text-gray-900">
                    Producto en Oferta
                  </h3>
                  <p className="mb-[16px] text-gray-600">
                    Descripción del producto en oferta especial.
                  </p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="h-[40px]" type="primary">
                      Ver más
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        <motion.img
          initial={{ opacity: 0, scale: 1.05 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          src="/banner-horario.png"
          alt="Banner de horario"
          className="w-full"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full bg-primary p-[24px] text-center text-white"
        >
          <p className="text-lg font-medium">
            Si requieres información y atención personalizada solo debes contactarte con nosotros.
          </p>
        </motion.div>
      </motion.section>
    </>
  );
};

export default Home;
