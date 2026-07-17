import { FilterOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  ConfigProvider,
  Drawer,
  Empty,
  Image,
  InputNumber,
  message,
  Pagination,
  Select,
  Skeleton,
  Spin,
  Tag,
} from 'antd';
import esES from 'antd/locale/es_ES';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';

import { type CatalogFilterItem, fetchBrands, fetchDepartments } from '../../../api/catalog';
import { api } from '../../../api/client';
import { formatBs } from '../../../constants/pricing';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { useUsdRate } from '../../../context/ExchangeRateContext';
import { useHomeCatalog } from '../../../context/HomeCatalogContext';
import { theme } from '../../../theme';
import { CatalogSidebar } from './CatalogSidebar';

type ProductsCatalogProps = {
  externalDepartments?: CatalogFilterItem[];
  initialDepartmentId?: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  brand: string;
  price: number;
  code: string;
  department: string;
  imageUrl: string | null;
  stockQuantity: number | null;
};

type ProductsResponse = {
  data: ProductRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE_OPTIONS = [24, 50, 100] as const;

type SortParam = '' | 'priceAsc' | 'priceDesc';

const SORT_OPTIONS: { label: string; value: SortParam }[] = [
  { label: 'Orden por defecto (nombre)', value: '' },
  { label: 'Precio: menor a mayor', value: 'priceAsc' },
  { label: 'Precio: mayor a menor', value: 'priceDesc' },
];

const PRODUCT_IMAGE_HEIGHT = 180;

function CatalogProductImage({ alt, src }: { alt: string; src: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="relative flex w-full items-center justify-center overflow-hidden bg-[#FCFCFC] p-[12px]"
      style={{ height: PRODUCT_IMAGE_HEIGHT }}
    >
      {!loaded ? (
        <Skeleton.Image
          active
          className="!absolute !inset-0 !flex !h-full !w-full !items-center !justify-center !rounded-none [&_.ant-skeleton-image-svg]:!h-[48px] [&_.ant-skeleton-image-svg]:!w-[48px] [&_.ant-skeleton-image]:!h-full [&_.ant-skeleton-image]:!w-full"
        />
      ) : null}
      <Image
        alt={alt}
        className={`object-contain transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        preview={false}
        src={src}
        style={{ maxHeight: PRODUCT_IMAGE_HEIGHT - 24, maxWidth: '100%' }}
        onError={() => setLoaded(true)}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function CatalogProductCard({ p, hideDepartment }: { p: ProductRow; hideDepartment?: boolean }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const canShop = !user || user.type === 'client';
  const usdRate = useUsdRate();
  const maxOrder = p.stockQuantity != null ? Math.max(0, p.stockQuantity) : 9999;
  const [qty, setQty] = useState(1);
  const lowStock = p.stockQuantity != null && p.stockQuantity > 0 && p.stockQuantity < 20;

  const handleAdd = () => {
    const { added, requested } = addToCart(
      {
        id: p.id,
        brand: p.brand,
        code: p.code,
        imageUrl: p.imageUrl ?? undefined,
        name: p.name,
        price: p.price,
        stockQuantity: p.stockQuantity,
      },
      qty
    );
    if (added === 0) {
      void message.warning('No se pudo agregar: sin existencias disponibles');
    } else if (added < requested) {
      void message.success(`Se agregaron ${added} uds. (máximo disponible según inventario)`);
    } else {
      void message.success('Producto agregado al carrito');
    }
  };

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group h-full"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md">
        {p.imageUrl ? (
          <CatalogProductImage key={p.imageUrl} alt={p.name} src={p.imageUrl} />
        ) : (
          <div
            className="relative flex w-full items-center justify-center bg-[#FCFCFC]"
            style={{ height: PRODUCT_IMAGE_HEIGHT }}
          >
            <span className="text-sm text-gray-400">Sin imagen</span>
          </div>
        )}
        <div className="flex flex-1 flex-col p-[14px]">
          {p.brand ? (
            <p className="mb-[4px] truncate text-[11px] uppercase tracking-wide text-gray-500">
              {p.brand}
            </p>
          ) : null}
          <h3 className="mb-[8px] line-clamp-2 min-h-[2.5rem] text-[14px] font-semibold leading-snug text-gray-900">
            {p.name}
          </h3>
          {!hideDepartment && p.department ? (
            <p className="mb-[8px] truncate text-[11px] text-gray-400">{p.department}</p>
          ) : null}
          <div className="mt-auto">
            <div className="mb-[8px] flex items-baseline gap-[8px]">
              <p className="text-xl font-bold tabular-nums tracking-tight text-primary">
                Bs {formatBs(p.price, usdRate)}
              </p>
              {lowStock ? (
                <span className="rounded-full bg-red-50 px-[8px] py-[2px] text-[10px] font-semibold text-red-600">
                  Últimas unidades
                </span>
              ) : null}
            </div>
            {canShop ? (
              <div className="flex items-center gap-[8px]">
                <InputNumber
                  className="min-w-[72px] flex-1"
                  max={maxOrder}
                  min={1}
                  size="small"
                  value={qty}
                  onChange={(v) => setQty(typeof v === 'number' && v >= 1 ? Math.trunc(v) : 1)}
                />
                <Button className="flex-1" size="small" type="primary" onClick={handleAdd}>
                  Agregar
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    </motion.li>
  );
}

const ProductsCatalog = ({
  externalDepartments,
  initialDepartmentId,
}: ProductsCatalogProps = {}) => {
  const homeCatalog = useHomeCatalog();
  const debouncedSearch = homeCatalog?.search.trim() ?? '';
  const selectedStoreId = homeCatalog?.selectedStoreId ?? '';
  const filtersReady = homeCatalog?.filtersReady ?? false;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(24);
  const [sort, setSort] = useState<SortParam>('');
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50]);
  const [sliderValue, setSliderValue] = useState<[number, number]>([0, 50]);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState<[number, number]>([0, 50]);
  const [brands, setBrands] = useState<CatalogFilterItem[]>([]);
  const [departments, setDepartments] = useState<CatalogFilterItem[]>(externalDepartments ?? []);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ProductsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setPriceRange(sliderValue);
      if (sliderValue[0] > 0 || sliderValue[1] < 50) {
        setPage(1);
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [sliderValue]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [priceRange]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setPage(1);
    }, 500);
    return () => window.clearTimeout(handle);
  }, [debouncedSearch]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const b = await fetchBrands();
      if (!cancelled) setBrands(b);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (externalDepartments) return;
    void (async () => {
      const d = await fetchDepartments();
      setDepartments(d);
    })();
  }, [externalDepartments]);

  useEffect(() => {
    if (initialDepartmentId !== undefined) {
      setSelectedDepartmentId(initialDepartmentId);
      setPage(1);
    }
  }, [initialDepartmentId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: Record<string, string> = {
      page: String(page),
      pageSize: String(pageSize),
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (sort === 'priceAsc' || sort === 'priceDesc') params.sort = sort;
    if (selectedBrandId) params.brand = selectedBrandId;
    if (selectedDepartmentId) params.department = selectedDepartmentId;
    if (debouncedPriceRange[0] > 0) params.minPrice = String(debouncedPriceRange[0]);
    if (debouncedPriceRange[1] < 50) params.maxPrice = String(debouncedPriceRange[1]);
    if (selectedStoreId) params.storeId = selectedStoreId;
    try {
      const { data, ok, status } = await api<ProductsResponse>('/api/products', {
        skipAuth: true,
        params,
      });
      if (!ok) {
        setError(
          typeof data === 'object' && data && 'error' in data
            ? String((data as { error: string }).error)
            : `Error ${status}`
        );
        setResult(null);
        return;
      }
      if (!data || !Array.isArray(data.data)) {
        setError('La API devolvió un formato de productos inválido.');
        setResult(null);
        return;
      }
      setResult(data);
    } catch {
      setError('Error al cargar el catálogo. Intenta de nuevo.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    pageSize,
    sort,
    selectedBrandId,
    selectedDepartmentId,
    debouncedPriceRange,
    selectedStoreId,
  ]);

  useEffect(() => {
    if (!filtersReady) return;
    if (!selectedStoreId) return;
    void load();
  }, [load, filtersReady, selectedStoreId]);

  const handleSelectBrand = (id: string | null) => {
    setSelectedBrandId(id);
    setPage(1);
    setFiltersDrawerOpen(false);
  };

  const handleSelectDepartment = (id: string | null) => {
    setSelectedDepartmentId(id);
    setPage(1);
    setFiltersDrawerOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedBrandId(null);
    setSelectedDepartmentId(null);
    setPriceRange([0, 50]);
    setSliderValue([0, 50]);
    setDebouncedPriceRange([0, 50]);
    setPage(1);
    setFiltersDrawerOpen(false);
  };

  const activeBrandName = brands.find((b) => b.id === selectedBrandId)?.name;
  const activeDepartmentName = departments.find((d) => d.id === selectedDepartmentId)?.name;
  const hasFilter =
    selectedBrandId !== null ||
    selectedDepartmentId !== null ||
    priceRange[0] > 0 ||
    priceRange[1] < 50;

  const catalogTitle = activeDepartmentName
    ? activeDepartmentName
    : activeBrandName
      ? `Marca: ${activeBrandName}`
      : debouncedSearch
        ? `Resultados para “${debouncedSearch}”`
        : 'Todos los productos';

  const sidebarProps = {
    brands,
    departments,
    selectedBrandId,
    selectedDepartmentId,
    priceRange: sliderValue,
    onSelectBrand: handleSelectBrand,
    onSelectDepartment: handleSelectDepartment,
    onPriceRangeChange: (v: number | number[]) => {
      if (Array.isArray(v)) setSliderValue(v as [number, number]);
    },
    onClear: handleClearFilters,
  };

  return (
    <ConfigProvider locale={esES} theme={theme}>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="relative mx-auto w-full max-w-7xl overflow-x-clip rounded-2xl border border-gray-200 bg-white py-[24px]"
      >
        <div className="relative mx-auto w-full px-[16px] sm:px-[24px] lg:px-[32px]">
          <div className="mb-[24px] flex flex-col gap-[16px] md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="mb-[6px] text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                {catalogTitle}
              </h2>
              {result && result.total > 0 ? (
                <p className="text-sm text-gray-600">
                  Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, result.total)} de{' '}
                  {result.total} productos
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Filtra por marca o categoría en el panel lateral.
                </p>
              )}
            </div>
            <div className="flex w-full flex-col gap-[12px] sm:flex-row sm:items-end sm:justify-end md:max-w-md md:shrink-0">
              <Button
                className="lg:hidden"
                icon={<FilterOutlined />}
                onClick={() => setFiltersDrawerOpen(true)}
              >
                Filtros
              </Button>
              <Select
                className="w-full min-w-[200px]"
                options={SORT_OPTIONS}
                placeholder="Ordenar por"
                size="large"
                value={sort || undefined}
                onChange={(v) => {
                  setSort(v);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {hasFilter ? (
            <div className="mb-[20px] flex flex-wrap items-center gap-[8px]">
              {activeBrandName ? (
                <Tag closable onClose={() => handleSelectBrand(null)} className="m-0">
                  Marca: {activeBrandName}
                </Tag>
              ) : null}
              {activeDepartmentName ? (
                <Tag closable onClose={() => handleSelectDepartment(null)} className="m-0">
                  Categoría: {activeDepartmentName}
                </Tag>
              ) : null}
              <Button size="small" type="link" onClick={handleClearFilters}>
                Limpiar filtros
              </Button>
            </div>
          ) : null}

          <Drawer
            title="Filtros"
            placement="left"
            open={filtersDrawerOpen}
            onClose={() => setFiltersDrawerOpen(false)}
            className="lg:hidden"
            width={300}
          >
            <CatalogSidebar {...sidebarProps} />
          </Drawer>

          <Spin
            spinning={loading}
            size="large"
            tip={loading ? 'Cargando productos…' : undefined}
            classNames={{
              root: 'max-h-none overflow-visible',
              container: 'max-h-none overflow-visible',
            }}
          >
            <div className="flex flex-col gap-[24px] lg:flex-row lg:items-start">
              <div className="hidden lg:block">
                <CatalogSidebar {...sidebarProps} />
              </div>
              <div className="min-w-0 flex-1">
                {error ? (
                  <Alert
                    className="rounded-2xl border-red-100 bg-red-50/80"
                    message={error}
                    showIcon
                    type="error"
                  />
                ) : result && result.data.length === 0 ? (
                  <Empty className="py-[48px]" description="No hay productos para mostrar">
                    {hasFilter ? (
                      <Button type="primary" onClick={handleClearFilters}>
                        Limpiar filtros
                      </Button>
                    ) : null}
                  </Empty>
                ) : (
                  <>
                    <ul className="mb-[32px] grid list-none gap-[16px] sm:grid-cols-2 xl:grid-cols-3 min-[1700px]:grid-cols-4">
                      {(result?.data ?? []).map((p) => (
                        <CatalogProductCard
                          key={p.id}
                          p={p}
                          hideDepartment={selectedDepartmentId !== null}
                        />
                      ))}
                    </ul>
                    {result && result.total > 0 ? (
                      <div className="flex flex-col items-center gap-[16px] border-t border-gray-200/80 pt-[24px] sm:flex-row sm:justify-center">
                        <Pagination
                          className="[&_.ant-pagination-item-active]:border-primary [&_.ant-pagination-item-active]:bg-primary [&_.ant-pagination-item-active_a]:!text-white"
                          current={page}
                          pageSize={pageSize}
                          pageSizeOptions={PAGE_SIZE_OPTIONS.map(String)}
                          showSizeChanger
                          showTotal={(total, range) =>
                            `${range[0]}–${range[1]} de ${total} productos`
                          }
                          total={result.total}
                          onChange={(p) => {
                            setPage(p);
                            const el = document.getElementById('products-catalog');
                            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          onShowSizeChange={(_current, size) => {
                            setPageSize(size);
                            setPage(1);
                          }}
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </Spin>
        </div>
      </motion.section>
    </ConfigProvider>
  );
};

export default ProductsCatalog;
