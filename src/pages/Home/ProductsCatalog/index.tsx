import { FilterOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  ConfigProvider,
  Drawer,
  Empty,
  Image,
  Input,
  InputNumber,
  message,
  Pagination,
  Select,
  Spin,
  Tag,
} from 'antd';
import esES from 'antd/locale/es_ES';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';

import { type CatalogFilterItem, fetchBrands, fetchDepartments } from '../../../api/catalog';
import { api } from '../../../api/client';
import { useCart } from '../../../context/CartContext';
import { theme } from '../../../theme';
import { CatalogSidebar } from './CatalogSidebar';

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  brand: string;
  price: number;
  code: string;
  department: string;
  imageUrl: string | null;
  totalStock: number | null;
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

function CatalogProductCard({ p }: { p: ProductRow }) {
  const { addToCart } = useCart();
  const maxOrder = p.totalStock != null ? Math.max(0, p.totalStock) : 9999;
  const [qty, setQty] = useState(1);

  const handleAdd = () => {
    const { added, requested } = addToCart(
      {
        id: p.id,
        brand: p.brand,
        code: p.code,
        name: p.name,
        price: p.price,
        totalStock: p.totalStock,
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="group h-full"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100/90 bg-white/90 shadow-md ring-1 ring-black/[0.03] backdrop-blur-sm transition-all duration-300 hover:-translate-y-[4px] hover:shadow-xl hover:ring-primary/20">
        {p.imageUrl ? (
          <div className="relative flex h-[180px] w-full items-center justify-center overflow-hidden bg-white">
            <Image
              alt={p.name}
              className="max-h-[160px] object-cover"
              src={p.imageUrl}
              loadingProps={{ lazy: true }}
            />
            <div className="absolute left-0 top-0 h-[4px] w-full" />
          </div>
        ) : (
          <div
            className="relative flex w-full items-center justify-center"
            style={{ height: '180px' }}
          >
            <span className="text-5xl text-white/70"></span>
          </div>
        )}
        <div className="flex flex-1 flex-col p-[16px] sm:p-[20px]">
          <div className="mb-[8px] flex flex-wrap items-center gap-[6px]">
            <Tag className="bg-primary/12 m-0 border-0 text-[11px] font-medium text-primary">
              {p.brand}
            </Tag>
            <span className="text-[11px] text-gray-400">{p.department}</span>
          </div>
          <h3 className="mb-[6px] line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900">
            {p.name}
          </h3>
          <div className="mt-auto border-t border-gray-100 pt-[12px]">
            <p className="text-xl font-bold tabular-nums tracking-tight text-primary">
              REF {p.price}
            </p>
            <p className="mt-[4px] text-[11px] text-gray-400">
              Cód. {p.code}
              {p.totalStock != null && p.totalStock < 20 ? (
                <span className="ml-[10px] text-red-500">Quedan {p.totalStock} unidades</span>
              ) : null}
            </p>
            <div className="mt-[10px] flex flex-wrap items-center gap-[6px]">
              <span className="text-[12px] text-gray-600">Cant.</span>
              <InputNumber
                className="min-w-[80px]"
                max={maxOrder}
                min={1}
                size="small"
                value={qty}
                onChange={(v) => setQty(typeof v === 'number' && v >= 1 ? Math.trunc(v) : 1)}
              />
              <Button size="small" type="primary" onClick={handleAdd}>
                Agregar
              </Button>
            </div>
          </div>
        </div>
      </article>
    </motion.li>
  );
}

const ProductsCatalog = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [sort, setSort] = useState<SortParam>('');
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50]);
  const [sliderValue, setSliderValue] = useState<[number, number]>([0, 50]);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState<[number, number]>([0, 50]);
  const [brands, setBrands] = useState<CatalogFilterItem[]>([]);
  const [departments, setDepartments] = useState<CatalogFilterItem[]>([]);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ProductsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 500);
    return () => window.clearTimeout(handle);
  }, [search]);

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
    void (async () => {
      const [b, d] = await Promise.all([fetchBrands(), fetchDepartments()]);
      setBrands(b);
      setDepartments(d);
    })();
  }, []);

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
  ]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

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

  const sidebarProps = {
    brands,
    departments,
    selectedBrandId,
    selectedDepartmentId,
    priceRange: sliderValue,
    onSelectBrand: handleSelectBrand,
    onSelectDepartment: handleSelectDepartment,
    onPriceRangeChange: setSliderValue,
    onClear: handleClearFilters,
  };

  return (
    <ConfigProvider locale={esES} theme={theme}>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="relative mx-auto mb-[64px] w-full max-w-[1500px] overflow-x-clip overflow-y-visible rounded-[24px] border border-gray-200/80 bg-gradient-to-br from-white via-gray-50/50 to-primary/[0.06] py-[40px] shadow-[0_24px_80px_-32px_rgba(0,0,0,0.15)] sm:py-[48px]"
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-[2200px] px-[16px] sm:px-[24px] lg:px-[32px]">
          <div className="mb-[32px] flex flex-col gap-[16px] md:mb-[40px] md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="mb-[8px] text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                Catálogo de productos
              </h2>
              <p className="max-w-xl text-base text-gray-600">
                Busca por nombre, código, descripción o marca. Filtra por marca o categoría en el
                panel lateral.
              </p>
            </div>
            <div className="flex w-full flex-col gap-[12px] sm:flex-row sm:items-end sm:justify-end md:max-w-2xl md:shrink-0">
              <Button
                className="lg:hidden"
                icon={<FilterOutlined />}
                onClick={() => setFiltersDrawerOpen(true)}
              >
                Filtros
              </Button>
              <div className="w-full min-w-[200px] flex-1 sm:max-w-md">
                <Input.Search
                  allowClear
                  placeholder="Buscar productos…"
                  size="large"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="[&_.ant-input-affix-wrapper]:rounded-xl [&_.ant-input-affix-wrapper]:border-gray-200 [&_.ant-input-affix-wrapper]:shadow-sm"
                />
              </div>
              <Select
                className="w-full min-w-[200px] sm:w-[240px]"
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
                  <Empty className="py-[48px]" description="No hay productos para mostrar" />
                ) : (
                  <>
                    <ul className="mb-[40px] grid list-none gap-[20px] sm:grid-cols-2 xl:grid-cols-3 min-[2000px]:grid-cols-4">
                      {(result?.data ?? []).map((p) => (
                        <CatalogProductCard key={p.id} p={p} />
                      ))}
                    </ul>
                    {result && result.total > 0 ? (
                      <div className="flex flex-col items-center gap-[16px] border-t border-gray-200/80 pt-[32px] sm:flex-row sm:justify-center">
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
                          onChange={(p) => setPage(p)}
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
