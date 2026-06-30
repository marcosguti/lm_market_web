import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { getActiveBanners } from '../../api/banners';
import { type CatalogFilterItem, fetchDepartments } from '../../api/catalog';
import { getActiveDeals } from '../../api/deals';
import Carousel from '../../components/Carousel';
import DealBannerModal from '../../components/DealBannerModal';
import SEO from '../../components/SEO';
import OfferCarousel from './OfferCarousel';
import OfferCard from './OfferCard';
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
      <div className="relative">
        <Carousel
          key={bannerSlides.map((banner) => banner.imageUrl).join('|')}
          loading={bannersLoading}
          slides={bannerSlides}
        />

        <div className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-start pt-[32px] sm:pt-[40px] lg:pt-[48px] bg-gradient-to-r from-black/40 via-black/20 to-transparent text-white">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl font-bold drop-shadow-lg sm:text-4xl lg:text-5xl"
          >
            Ofertas imperdibles
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-2 text-sm drop-shadow-md sm:text-base lg:text-lg"
          >
            Calidad al mejor precio
          </motion.p>
        </div>
      </div>

      <div id="products-catalog" className="relative z-10 -mt-[400px] sm:-mt-[450px] lg:-mt-[500px] pb-[24px] sm:pb-[32px]">
        <ProductsCatalog
          key={selectedDepartmentId ?? 'all'}
          externalDepartments={departments}
          initialDepartmentId={selectedDepartmentId}
        />
      </div>

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

      {!dealsLoading && activeDeals.length > 0 && (
        <section
          id="ofertas-section"
          className="mx-auto max-w-7xl px-[16px] py-[32px] sm:px-[24px] lg:px-[32px]"
        >
          <div className="mb-[20px] flex flex-col gap-[8px] sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Ver Todas las Ofertas y Más
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Las mejores promociones de la semana
              </p>
            </div>
            <button
              type="button"
              onClick={handleOfferClick}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Ver todo
            </button>
          </div>

          <OfferCarousel>
            {activeDeals.slice(0, 12).map((imageUrl) => (
              <OfferCard
                key={imageUrl}
                imageUrl={imageUrl}
                onClick={handleOfferClick}
              />
            ))}
          </OfferCarousel>
        </section>
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
