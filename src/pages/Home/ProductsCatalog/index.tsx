import {
  Alert,
  Button,
  ConfigProvider,
  Empty,
  Input,
  InputNumber,
  message,
  Pagination,
  Spin,
  Tag,
} from 'antd';
import esES from 'antd/locale/es_ES';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';

import { api } from '../../../api/client';
import { useCart } from '../../../context/CartContext';
import { theme } from '../../../theme';

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  brand: string;
  price: number;
  code: string;
  department: string;
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

function CatalogProductCard({ p }: { p: ProductRow }) {
  const { addToCart } = useCart();
  const maxOrder = p.totalStock != null ? Math.max(0, p.totalStock) : 9999;
  const [qty, setQty] = useState(1);

  const handleAdd = () => {
    const { added, requested } = addToCart(
      {
        id: p.id,
        brand: p.brand,
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
        <div className="h-[4px] w-full bg-gradient-to-r from-primary via-lime-400 to-emerald-500 opacity-90" />
        <div className="flex flex-1 flex-col p-[20px] sm:p-[24px]">
          <div className="mb-[12px] flex flex-wrap items-center gap-[8px]">
            <Tag className="bg-primary/12 m-0 border-0 font-medium text-primary">{p.brand}</Tag>
            <span className="text-xs text-gray-400">{p.department}</span>
          </div>
          <h3 className="mb-[8px] line-clamp-2 text-lg font-semibold leading-snug text-gray-900">
            {p.name}
          </h3>
          {p.description ? (
            <p className="mb-[16px] line-clamp-2 flex-1 text-sm leading-relaxed text-gray-500">
              {p.description}
            </p>
          ) : (
            <div className="mb-[16px] flex-1" />
          )}
          <div className="mt-auto border-t border-gray-100 pt-[16px]">
            <p className="text-2xl font-bold tabular-nums tracking-tight text-primary">
              REF {p.price}
            </p>
            <p className="mt-[8px] text-xs text-gray-400">
              Cód. {p.code}
              {p.totalStock !== null && p.totalStock !== undefined
                ? ` · Disponibles: ${p.totalStock}`
                : ''}
            </p>
            <div className="mt-[12px] flex flex-wrap items-center gap-[8px]">
              <span className="text-xs text-gray-600">Cant.</span>
              <InputNumber
                className="min-w-[88px]"
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
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ProductsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 500);
    return () => window.clearTimeout(handle);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: Record<string, string> = {
      page: String(page),
      pageSize: String(pageSize),
    };
    if (debouncedSearch) params.search = debouncedSearch;
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
  }, [page, debouncedSearch, pageSize]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

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
                Busca por descripción o marca. Precios y existencias sincronizados con el almacén.
              </p>
            </div>
            <div className="w-full max-w-md md:shrink-0">
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
          </div>
          <Spin
            spinning={loading}
            size="large"
            tip={loading ? 'Cargando productos…' : undefined}
            classNames={{
              root: 'max-h-none overflow-visible',
              container: 'max-h-none overflow-visible',
            }}
          >
            <div>
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
                  <ul className="mb-[40px] grid list-none gap-[20px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[2000px]:grid-cols-5">
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
          </Spin>
        </div>
      </motion.section>
    </ConfigProvider>
  );
};

export default ProductsCatalog;
