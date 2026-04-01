import { motion } from 'framer-motion';

import SEO from '../../components/SEO';

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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
    },
  },
};

const About = () => {
  return (
    <>
      <SEO
        title="Nosotros"
        description="Conoce más sobre LM Market, nuestra misión, visión y valores. Empresa especializada en ofrecer productos de excelente calidad al mejor precio."
      />
      <div className="mx-auto max-w-7xl px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-[32px] text-4xl font-bold text-gray-900"
        >
          Nosotros
        </motion.h1>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-[48px]"
        >
          <motion.section
            variants={itemVariants}
            className="grid gap-[32px] md:grid-cols-2 md:items-center"
          >
            <motion.img
              variants={imageVariants}
              src="/nosotros.jpg"
              alt="Quiénes Somos"
              className="h-64 w-full rounded-lg object-cover"
            />
            <motion.div variants={itemVariants}>
              <h2 className="mb-[16px] text-2xl font-bold text-gray-900">Quiénes Somos</h2>
              <p className="leading-relaxed text-gray-700">
                En LM Market, C.A, somos una empresa especializada en ofrecer productos de excelente
                calidad al mejor precio; a través de un servicio de excelencia que nos ha convertido
                en referentes en el estado, brindando un trato amable y profesional a todos nuestros
                clientes, esmerándonos para que sus compras se transformen en una experiencia
                agradable, generadora de bienestar y tranquilidad, para ello; nos hemos propuesto
                que la mejora continua, forme parte de los objetivos de cada uno de nuestros
                colaboradores.
              </p>
            </motion.div>
          </motion.section>

          <motion.section
            variants={itemVariants}
            className="grid gap-[32px] md:grid-cols-2 md:items-center"
          >
            <motion.div variants={itemVariants} className="order-2 md:order-1">
              <h2 className="mb-[16px] text-2xl font-bold text-gray-900">Misión</h2>
              <p className="leading-relaxed text-gray-700">
                La misión de LM MARKET es proporcionar a nuestros clientes una experiencia de compra
                excepcional, donde la calidad y la belleza del entorno no comprometen la
                accesibilidad de nuestros precios. Creemos firmemente que un supermercado atractivo
                y bien diseñado puede ser accesible para todos, por lo que nos comprometemos a
                ofrecer productos de alta calidad en un ambiente agradable, sin que esto se traduzca
                en costos elevados, Nuestro objetivo es desmontar la idea de que la estética y el
                buen servicio son sinónimos de precios altos, demostrando que en LM MARKET, la
                experiencia de compra puede ser tanto placentera como económica, ¡haciendo la unión
                perfecta PRECIOS BAJOS Y CALIDAD! ¡De aquí sale nuestro eslogan LM calidad al mejor
                precio!
              </p>
            </motion.div>
            <motion.img
              variants={imageVariants}
              src="/mision.jpg"
              alt="Misión"
              className="order-1 h-64 w-full rounded-lg object-cover md:order-2"
            />
          </motion.section>

          <motion.section
            variants={itemVariants}
            className="grid gap-[32px] md:grid-cols-2 md:items-center"
          >
            <motion.img
              variants={imageVariants}
              src="/vision.jpg"
              alt="Visión"
              className="h-64 w-full rounded-lg object-cover"
            />
            <motion.div variants={itemVariants}>
              <h2 className="mb-[16px] text-2xl font-bold text-gray-900">Visión</h2>
              <p className="leading-relaxed text-gray-700">
                Desarrollar, obtener y mantener un sólido posicionamiento de mercado, con una alta
                preferencia de nuestros clientes actuales y futuros basados en nuestra misión y
                valores.
              </p>
            </motion.div>
          </motion.section>

          <motion.section
            variants={itemVariants}
            className="grid gap-[32px] md:grid-cols-2 md:items-center"
          >
            <motion.div variants={itemVariants} className="order-2 md:order-1">
              <h2 className="mb-[16px] text-2xl font-bold text-gray-900">Valores</h2>
              <p className="leading-relaxed text-gray-700">
                Trabajo Constante basado en atención y servicio al cliente, Compromiso con la
                sociedad merideña, Compromiso con nuestros Empleados y Trabajadores.
              </p>
            </motion.div>
            <motion.img
              variants={imageVariants}
              src="/mision_corporativa.jpg"
              alt="Valores"
              className="order-1 h-64 w-full rounded-lg object-cover md:order-2"
            />
          </motion.section>
        </motion.div>
      </div>
    </>
  );
};

export default About;
