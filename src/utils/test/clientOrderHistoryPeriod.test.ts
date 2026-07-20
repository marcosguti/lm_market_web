import { describe, expect, it } from 'vitest';

import { resolveClientHistoryPeriodDates } from '../clientOrderHistoryPeriod';

describe('resolveClientHistoryPeriodDates', () => {
  const referenceDate = new Date('2026-07-20T15:00:00.000Z');

  it('returns empty range for all', () => {
    expect(resolveClientHistoryPeriodDates('all', referenceDate)).toEqual({});
  });

  it('resolves last30d as inclusive 30-day Caracas window ending today', () => {
    expect(resolveClientHistoryPeriodDates('last30d', referenceDate)).toEqual({
      createdFrom: '2026-06-21',
      createdTo: '2026-07-20',
    });
  });

  it('resolves last3m as inclusive ~90-day Caracas window ending today', () => {
    expect(resolveClientHistoryPeriodDates('last3m', referenceDate)).toEqual({
      createdFrom: '2026-04-22',
      createdTo: '2026-07-20',
    });
  });
});
