import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { getActiveBanners } from '../../api/banners';
import { type CatalogFilterItem, fetchDepartments } from '../../api/catalog';
import { getActiveDeals } from '../../api/deals';
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
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
    },
  },
};

const Home = () => {
  const [showDeals, setShowDeals] = useState(
    () => sessionStorage.getItem(DEALS_SESSION_KEY) !== '1'
  );
  const [activeDeals, setActiveDeals] = useState<string[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [bannerSlides, setBannerSlides] = useState<{ imageUrl: string; alt?: string }[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [departments, setDepartments] = useState<CatalogFilterItem[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    const loadDeals = async () => {
      const res = await getActiveDeals();
      setDealsLoading(false);
      if (res.ok && res.data?.data) {
        setActiveDeals(res.data.data);
      }
    };
    void loadDeals();
  }, []);

  useEffect(() => {
    const loadBanners = async () => {
      const res = await getActiveBanners();
      setBannersLoading(false);
      if (res.ok && res.data?.data) {
        setBannerSlides(
          res.data.data.map((banner) => ({
            alt: banner.description ?? undefined,
            imageUrl: banner.imageUrl,
          }))
        );
      }
    };
    void loadBanners();
  }, []);

  useEffect(() => {
    void (async () => {
      const d = await fetchDepartments();
      setDepartments(d);
    })();
  }, []);

  const handleCloseDeals = () => {
    sessionStorage.setItem(DEALS_SESSION_KEY, '1');
    setShowDeals(false);
  };

  const handleDeptClick = (deptId: string) => {
    const newId = selectedDepartmentId === deptId ? null : deptId;
    setSelectedDepartmentId(newId);
    const catalogSection = document.getElementById('products-catalog');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOfferClick = () => {
    sessionStorage.setItem(DEALS_SESSION_KEY, '0');
    setShowDeals(true);
  };

  return (
    <>
      <AnimatePresence>
        {showDeals && activeDeals.length > 0 && (
          <DealBannerModal onClose={handleCloseDeals} onEmpty={() => setShowDeals(false)} />
        )}
      </AnimatePresence>
      <SEO
        title="Inicio"
        description="LM Market - Tu supermercado de confianza. Productos de excelente calidad al mejor precio. Ofertas especiales y atención personalizada."
      />
      <Carousel
        key={bannerSlides.map((banner) => banner.imageUrl).join('|')}
        loading={bannersLoading}
        slides={bannerSlides}
      />

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full bg-primary text-center text-white"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto max-w-7xl px-[16px] py-[24px] sm:px-[24px] sm:py-[32px] lg:px-[32px]"
        >
          <h1 className="mb-[8px] text-2xl font-bold sm:text-3xl lg:text-4xl">
            Calidad al mejor precio
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base">
            Tu supermercado de confianza en Mérida.
          </p>
        </motion.div>
      </motion.section>

      {departments.length > 0 && (
        <section className="mx-auto max-w-7xl px-[16px] py-[20px] sm:px-[24px] sm:py-[28px] lg:px-[32px]">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-[12px] text-base font-semibold text-gray-700 sm:text-lg"
          >
            Departamentos
          </motion.h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-[8px]"
          >
            {departments.map((dept) => (
              <motion.button
                key={dept.id}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleDeptClick(dept.id)}
                className={`rounded-xl bg-primary px-[16px] py-[10px] text-left text-white transition-all hover:bg-primary/90 ${
                  selectedDepartmentId === dept.id ? 'ring-2 ring-white ring-offset-1' : ''
                }`}
              >
                <span className="text-sm font-medium">{dept.name}</span>
              </motion.button>
            ))}
          </motion.div>
        </section>
      )}

      <div id="products-catalog" className="mx-auto w-full max-w-[1500px] py-[24px] sm:py-[32px]">
        <ProductsCatalog
          key={selectedDepartmentId ?? 'all'}
          externalDepartments={departments}
          initialDepartmentId={selectedDepartmentId}
        />
      </div>

      {!dealsLoading && activeDeals.length > 0 && (
        <div className="mx-auto max-w-7xl px-[16px] py-[24px] sm:px-[24px] lg:px-[32px]">
          <motion.section
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mb-[32px]"
          >
            <motion.h2
              variants={itemVariants}
              className="mb-[16px] flex items-center gap-[8px] text-xl font-bold text-gray-900 sm:text-2xl"
            >
              <span className="text-primary">🔥</span> Ofertas de la semana
            </motion.h2>
            <div className="grid gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
              {activeDeals.slice(0, 6).map((imageUrl, index) => (
                <motion.div
                  key={imageUrl}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="group relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition-shadow hover:shadow-lg"
                  onClick={handleOfferClick}
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={`Oferta ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-[12px]">
                    <p className="text-[11px] font-medium text-white/90 sm:text-[12px]">
                      Tap para ver la oferta
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      )}

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
          className="w-full bg-primary p-[20px] text-center text-white sm:p-[24px]"
        >
          <p className="text-sm font-medium sm:text-base">
            Si requieres información y atención personalizada, contáctanos.
          </p>
        </motion.div>
      </motion.section>
    </>
  );
};

export default Home;
