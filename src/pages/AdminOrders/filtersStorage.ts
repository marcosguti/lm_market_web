import type { OrderStatus } from '../../types/order';

import { ORDER_PERIOD_OPTIONS, type OrderPeriodFilter } from '../../utils/orderPeriodFilter';
import { ORDER_STATUS_FLOW } from '../../utils/orderStatus';

export const ADMIN_ORDERS_FILTERS_KEY = 'lm_market_admin_orders_filters';

const ALL_FILTER = 'all';

export type AdminOrdersFilters = {
  orderIdFilter: string;
  periodFilter: OrderPeriodFilter;
  statusFilter: OrderStatus | typeof ALL_FILTER;
  storeFilter: string;
};

export const DEFAULT_ADMIN_ORDERS_FILTERS: AdminOrdersFilters = {
  orderIdFilter: '',
  periodFilter: 'today',
  statusFilter: ALL_FILTER,
  storeFilter: ALL_FILTER,
};

const VALID_PERIODS = new Set<string>(ORDER_PERIOD_OPTIONS.map((option) => option.value));

/** Statuses shown in the AdminOrders filter (excludes pending). */
const VALID_STATUSES = new Set<string>([
  ALL_FILTER,
  ...ORDER_STATUS_FLOW.filter((status) => status !== 'pending'),
]);

function isValidFilters(value: unknown): value is AdminOrdersFilters {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.orderIdFilter === 'string' &&
    typeof candidate.storeFilter === 'string' &&
    typeof candidate.statusFilter === 'string' &&
    VALID_STATUSES.has(candidate.statusFilter) &&
    typeof candidate.periodFilter === 'string' &&
    VALID_PERIODS.has(candidate.periodFilter)
  );
}

export function loadAdminOrdersFilters(): AdminOrdersFilters {
  try {
    const raw = localStorage.getItem(ADMIN_ORDERS_FILTERS_KEY);
    if (!raw) return { ...DEFAULT_ADMIN_ORDERS_FILTERS };
    const parsed: unknown = JSON.parse(raw);
    if (!isValidFilters(parsed)) return { ...DEFAULT_ADMIN_ORDERS_FILTERS };
    return {
      orderIdFilter: parsed.orderIdFilter,
      periodFilter: parsed.periodFilter,
      statusFilter: parsed.statusFilter,
      storeFilter: parsed.storeFilter,
    };
  } catch {
    return { ...DEFAULT_ADMIN_ORDERS_FILTERS };
  }
}

export function saveAdminOrdersFilters(filters: AdminOrdersFilters): void {
  localStorage.setItem(ADMIN_ORDERS_FILTERS_KEY, JSON.stringify(filters));
}
