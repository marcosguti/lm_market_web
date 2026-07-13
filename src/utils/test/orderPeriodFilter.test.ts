import { describe, expect, it } from 'vitest';

import { resolveOrderPeriodDates } from '../orderPeriodFilter';

describe('resolveOrderPeriodDates', () => {
  const referenceDate = new Date(2026, 6, 13);

  it('returns empty range for all', () => {
    expect(resolveOrderPeriodDates('all', referenceDate)).toEqual({});
  });

  it('returns current month range', () => {
    expect(resolveOrderPeriodDates('currentMonth', referenceDate)).toEqual({
      createdFrom: '2026-07-01',
      createdTo: '2026-07-31',
    });
  });

  it('returns last three months range', () => {
    expect(resolveOrderPeriodDates('lastThreeMonths', referenceDate)).toEqual({
      createdFrom: '2026-05-01',
      createdTo: '2026-07-31',
    });
  });

  it('returns full 2025 range', () => {
    expect(resolveOrderPeriodDates('year2025', referenceDate)).toEqual({
      createdFrom: '2025-01-01',
      createdTo: '2025-12-31',
    });
  });
});
