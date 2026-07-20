import { Alert, Empty, Input, Pagination, Select, Spin, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';

import type { OrderEntity } from '../../types/order';

import { getOrderHistory } from '../../api/orders';
import { OrderHistoryCard } from '../../components/OrderHistoryCard';
import { OrderProductsModal } from '../../components/OrderProductsModal';
import { useUsdRate } from '../../context/ExchangeRateContext';
import { connectSocket } from '../../realtime/socket';
import {
  CLIENT_HISTORY_PERIOD_OPTIONS,
  type ClientHistoryPeriod,
  resolveClientHistoryPeriodDates,
} from '../../utils/clientOrderHistoryPeriod';

const { Title } = Typography;

const TOKEN_KEY = 'lm_market_token';
const PAGE_SIZE = 10;

interface OrderUpdatedPayload {
  id: string;
  status: string;
  totalAmount: number;
}

const MyOrdersPage = () => {
  const usdRate = useUsdRate();
  const [data, setData] = useState<OrderEntity[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [period, setPeriod] = useState<ClientHistoryPeriod>('last30d');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [productsModal, setProductsModal] = useState<{
    open: boolean;
    order: OrderEntity | null;
  }>({ open: false, order: null });

  const buildFilters = useCallback((nextPeriod: ClientHistoryPeriod, nextSearch: string) => {
    const dates = resolveClientHistoryPeriodDates(nextPeriod);
    const q = nextSearch.trim();
    return {
      ...dates,
      ...(q ? { q } : {}),
    };
  }, []);

  const fetchOrders = useCallback(
    async (nextPage: number, nextPeriod: ClientHistoryPeriod, nextSearch: string) => {
      setLoading(true);
      const result = await getOrderHistory(nextPage, PAGE_SIZE, buildFilters(nextPeriod, nextSearch));
      setLoading(false);
      if (!result.ok || !result.data?.data) {
        setError((result.data as { error?: string })?.error ?? 'No se pudo cargar el historial');
        return;
      }
      setData(result.data.data);
      setTotal(result.data.total);
      setPage(result.data.page);
      setError('');
    },
    [buildFilters]
  );

  const refetchOrders = useCallback(async () => {
    await fetchOrders(page, period, search);
  }, [fetchOrders, page, period, search]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const result = await getOrderHistory(1, PAGE_SIZE, buildFilters(period, search));
      if (cancelled) return;
      setLoading(false);
      if (!result.ok || !result.data?.data) {
        setError((result.data as { error?: string })?.error ?? 'No se pudo cargar el historial');
        return;
      }
      setData(result.data.data);
      setTotal(result.data.total);
      setPage(result.data.page);
      setError('');
    };
    void run();
    return () => {
      cancelled = true;
    };
    // Initial load only; subsequent fetches go through period/search handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const socket = connectSocket(token);

    const onOrderUpdated = (payload: OrderUpdatedPayload) => {
      setData((prev) => {
        const exists = prev.some((order) => order.id === payload.id);
        if (!exists) return prev;
        return prev.map((order) =>
          order.id === payload.id
            ? { ...order, status: payload.status as OrderEntity['status'] }
            : order
        );
      });
      if (payload.status !== 'pending') {
        void refetchOrders();
      }
    };

    socket.on('order:updated', onOrderUpdated);

    return () => {
      socket.off('order:updated', onOrderUpdated);
    };
  }, [refetchOrders]);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Title level={2}>Mis compras</Title>
      {error ? <Alert type="error" showIcon message={error} className="mb-4" /> : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-800">
            <strong>{total === 1 ? '1 pedido' : `${total} pedidos`}</strong> realizados en
          </span>
          <Select
            aria-label="Período de pedidos"
            className="min-w-[180px]"
            options={CLIENT_HISTORY_PERIOD_OPTIONS}
            value={period}
            onChange={(value: ClientHistoryPeriod) => {
              setPeriod(value);
              void fetchOrders(1, value, search);
            }}
          />
        </div>
        <Input.Search
          allowClear
          className="w-full max-w-[350px]"
          enterButton="Buscar"
          placeholder="Buscar todos los pedidos"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onSearch={(value) => {
            const next = value.trim();
            setSearchInput(value);
            setSearch(next);
            void fetchOrders(1, period, next);
          }}
        />
      </div>

      <Spin spinning={loading}>
        {!loading && data.length === 0 && !error ? (
          <Empty
            description={
              search || period !== 'all'
                ? 'No hay pedidos para estos filtros'
                : 'No tienes órdenes aún'
            }
            className="py-16"
          />
        ) : (
          <div className="flex flex-col gap-4">
            {data.map((order) => (
              <OrderHistoryCard
                key={order.id}
                order={order}
                usdRate={usdRate}
                onViewDetail={(selected) => setProductsModal({ open: true, order: selected })}
              />
            ))}
          </div>
        )}
      </Spin>

      {total > PAGE_SIZE ? (
        <div className="mt-6 flex justify-end">
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={total}
            showSizeChanger={false}
            onChange={(nextPage) => {
              void fetchOrders(nextPage, period, search);
            }}
          />
        </div>
      ) : null}

      <OrderProductsModal
        open={productsModal.open}
        order={productsModal.order}
        onClose={() => setProductsModal({ open: false, order: null })}
      />
    </section>
  );
};

export default MyOrdersPage;
