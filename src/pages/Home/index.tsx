import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { getActiveBanners } from '../../api/banners';
import { type CatalogFilterItem, fetchDepartments } from '../../api/catalog';
import { api } from '../../api/client';
import { getActiveDeals } from '../../api/deals';
import Carousel from '../../components/Carousel';
import DealBannerModal from '../../components/DealBannerModal';
import SEO from '../../components/SEO';
import { useHomeCatalog } from '../../context/HomeCatalogContext';
import DepartmentChips from './DepartmentChips';
import OfferCard from './OfferCard';
import OfferCarousel from './OfferCarousel';
import ProductsCatalog from './ProductsCatalog';
import ProductShelf, { type ShelfProduct } from './ProductShelf';

type ShelfRow = {
  departmentId: string;
  title: string;
  products: ShelfProduct[];
};

type ProductApiRow = ShelfProduct & {
  createdAt?: string;
};

type ProductsApiResponse = {
  data: ProductApiRow[];
};

const Home = () => {
  const { scrollToCatalog, selectedStoreId } = useHomeCatalog() ?? {};
  const [showDealsModal, setShowDealsModal] = useState(false);
  const [activeDeals, setActiveDeals] = useState<string[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [bannerSlides, setBannerSlides] = useState<{ imageUrl: string; alt?: string }[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [departments, setDepartments] = useState<CatalogFilterItem[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [shelfRows, setShelfRows] = useState<ShelfRow[]>([]);
  const [newArrivals, setNewArrivals] = useState<ShelfProduct[]>([]);

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

  useEffect(() => {
    if (!selectedStoreId) return;
    let cancelled = false;

    void (async () => {
      const { data, ok } = await api<ProductsApiResponse>('/api/products', {
        skipAuth: true,
        params: { page: '1', pageSize: '24', storeId: selectedStoreId },
      });
      if (cancelled || !ok || !data?.data) return;

      const sorted = [...data.data].sort((a, b) => {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bTime - aTime;
      });
      setNewArrivals(sorted.slice(0, 8));
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedStoreId]);

  useEffect(() => {
    if (!selectedStoreId || departments.length === 0) return;
    let cancelled = false;

    void (async () => {
      const featured = departments.slice(0, 3);
      const rows = await Promise.all(
        featured.map(async (dept) => {
          const { data, ok } = await api<ProductsApiResponse>('/api/products', {
            skipAuth: true,
            params: {
              page: '1',
              pageSize: '8',
              department: dept.id,
              storeId: selectedStoreId,
            },
          });
          if (!ok || !data?.data) {
            return { departmentId: dept.id, title: `Explora ${dept.name}`, products: [] };
          }
          return {
            departmentId: dept.id,
            title: `Explora ${dept.name}`,
            products: data.data,
          };
        })
      );
      if (!cancelled) setShelfRows(rows.filter((row) => row.products.length > 0));
    })();

    return () => {
      cancelled = true;
    };
  }, [departments, selectedStoreId]);

  const handleDeptSelect = (deptId: string | null) => {
    setSelectedDepartmentId(deptId);
    scrollToCatalog?.();
  };

  const handleOfferClick = () => {
    setShowDealsModal(true);
  };

  const handleCloseDeals = () => {
    setShowDealsModal(false);
  };

  const handleShelfSeeAll = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    scrollToCatalog?.();
  };

  return (
    <>
      <AnimatePresence>
        {showDealsModal && activeDeals.length > 0 ? (
          <DealBannerModal
            images={activeDeals}
            loading={dealsLoading}
            onClose={handleCloseDeals}
            onEmpty={() => setShowDealsModal(false)}
          />
        ) : null}
      </AnimatePresence>
      <SEO
        title="Inicio"
        description="LM Market - Tu supermercado de confianza. Productos de excelente calidad al mejor precio. Ofertas especiales y atención personalizada."
      />

      <div className="relative bg-gray-50">
        <Carousel
          key={bannerSlides.map((banner) => banner.imageUrl).join('|')}
          loading={bannersLoading}
          slides={bannerSlides}
        />
      </div>

      <DepartmentChips
        departments={departments}
        selectedDepartmentId={selectedDepartmentId}
        onSelect={handleDeptSelect}
      />

      {!dealsLoading && activeDeals.length > 0 ? (
        <section
          id="ofertas-section"
          className="mx-auto max-w-7xl px-[16px] py-[20px] sm:px-[24px] sm:py-[28px] lg:px-[32px]"
        >
          <div className="mb-[16px] flex flex-col gap-[8px] sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Ofertas de la semana</h2>
              <p className="mt-1 text-sm text-gray-600">Las mejores promociones para ti</p>
            </div>
            <button
              type="button"
              onClick={handleOfferClick}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Ver todas
            </button>
          </div>

          <OfferCarousel>
            {activeDeals.slice(0, 12).map((imageUrl) => (
              <OfferCard key={imageUrl} imageUrl={imageUrl} onClick={handleOfferClick} />
            ))}
          </OfferCarousel>
        </section>
      ) : null}

      {newArrivals.length > 0 ? (
        <ProductShelf title="Recién agregados" products={newArrivals} onSeeAll={scrollToCatalog} />
      ) : null}

      {shelfRows.map((row) => (
        <ProductShelf
          key={row.departmentId}
          title={row.title}
          products={row.products}
          onSeeAll={() => handleShelfSeeAll(row.departmentId)}
        />
      ))}

      <div
        id="products-catalog"
        className="bg-gray-50 px-[16px] py-[24px] sm:px-[24px] sm:py-[32px] lg:px-[32px]"
      >
        <ProductsCatalog
          externalDepartments={departments}
          initialDepartmentId={selectedDepartmentId}
        />
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
