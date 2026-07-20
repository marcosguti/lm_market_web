import { beforeEach, describe, expect, it } from 'vitest';

import {
  ADMIN_ORDERS_FILTERS_KEY,
  DEFAULT_ADMIN_ORDERS_FILTERS,
  loadAdminOrdersFilters,
  saveAdminOrdersFilters,
} from '../filtersStorage';

describe('admin orders filtersStorage', () => {
  beforeEach(() => {
    localStorage.removeItem(ADMIN_ORDERS_FILTERS_KEY);
  });

  it('returns defaults when localStorage is empty', () => {
    expect(loadAdminOrdersFilters()).toEqual(DEFAULT_ADMIN_ORDERS_FILTERS);
  });

  it('returns defaults when localStorage is corrupt', () => {
    localStorage.setItem(ADMIN_ORDERS_FILTERS_KEY, '{not-json');
    expect(loadAdminOrdersFilters()).toEqual(DEFAULT_ADMIN_ORDERS_FILTERS);
  });

  it('returns defaults when status is invalid', () => {
    localStorage.setItem(
      ADMIN_ORDERS_FILTERS_KEY,
      JSON.stringify({
        orderIdFilter: 'abc',
        periodFilter: 'today',
        statusFilter: 'not-a-status',
        storeFilter: 'all',
      })
    );
    expect(loadAdminOrdersFilters()).toEqual(DEFAULT_ADMIN_ORDERS_FILTERS);
  });

  it('returns defaults when period is invalid', () => {
    localStorage.setItem(
      ADMIN_ORDERS_FILTERS_KEY,
      JSON.stringify({
        orderIdFilter: '',
        periodFilter: 'yesterday',
        statusFilter: 'all',
        storeFilter: 'all',
      })
    );
    expect(loadAdminOrdersFilters()).toEqual(DEFAULT_ADMIN_ORDERS_FILTERS);
  });

  it('returns defaults when status is pending', () => {
    localStorage.setItem(
      ADMIN_ORDERS_FILTERS_KEY,
      JSON.stringify({
        orderIdFilter: '',
        periodFilter: 'today',
        statusFilter: 'pending',
        storeFilter: 'all',
      })
    );
    expect(loadAdminOrdersFilters()).toEqual(DEFAULT_ADMIN_ORDERS_FILTERS);
  });

  it('loads a valid saved shape', () => {
    const filters = {
      orderIdFilter: 'order-42',
      periodFilter: 'thisWeek' as const,
      statusFilter: 'preparing' as const,
      storeFilter: 'store-1',
    };
    localStorage.setItem(ADMIN_ORDERS_FILTERS_KEY, JSON.stringify(filters));
    expect(loadAdminOrdersFilters()).toEqual(filters);
  });

  it('roundtrips save and load', () => {
    const filters = {
      orderIdFilter: 'xyz',
      periodFilter: 'currentMonth' as const,
      statusFilter: 'delivered' as const,
      storeFilter: 'store-2',
    };
    saveAdminOrdersFilters(filters);
    expect(loadAdminOrdersFilters()).toEqual(filters);
    expect(JSON.parse(localStorage.getItem(ADMIN_ORDERS_FILTERS_KEY)!)).toEqual(filters);
  });
});
