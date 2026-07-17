import { describe, expect, it } from 'vitest';

import {
  DEFAULT_USD_RATE,
  formatBs,
  formatOrderTotalBs,
  resolveOrderUsdRate,
  usdToBs,
} from '../pricing';

describe('usdToBs', () => {
  it('converts with provided rate', () => {
    expect(usdToBs(1.23, 600)).toBe(738);
  });

  it('defaults to DEFAULT_USD_RATE', () => {
    expect(usdToBs(1)).toBe(DEFAULT_USD_RATE);
  });
});

describe('formatBs', () => {
  it('formats converted amount', () => {
    expect(formatBs(1, 600)).toMatch(/600/);
  });
});

describe('resolveOrderUsdRate', () => {
  it('prefers order snapshot over live rate', () => {
    expect(resolveOrderUsdRate({ exchangeRate: 700 }, 600)).toBe(700);
  });

  it('falls back to live rate when order has no snapshot', () => {
    expect(resolveOrderUsdRate({ exchangeRate: null }, 625)).toBe(625);
  });
});

describe('formatOrderTotalBs', () => {
  it('uses totalAmountBs when present', () => {
    expect(
      formatOrderTotalBs({ exchangeRate: 600, totalAmount: 10, totalAmountBs: 1234.5 }),
    ).toMatch(/1\.234/);
  });

  it('converts with order exchangeRate', () => {
    expect(formatOrderTotalBs({ exchangeRate: 500, totalAmount: 2 }, 600)).toMatch(/1\.000/);
  });
});
