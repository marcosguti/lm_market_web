import { describe, expect, it } from 'vitest';

import { getCaracasDateParts, resolveOrderPeriodDates } from '../orderPeriodFilter';

describe('resolveOrderPeriodDates (America/Caracas)', () => {
  // Monday 13 Jul 2026 18:00Z = 14:00 Caracas same calendar day
  const referenceDate = new Date('2026-07-13T18:00:00.000Z');

  it('returns empty range for all', () => {
    expect(resolveOrderPeriodDates('all', referenceDate)).toEqual({});
  });

  it('returns today range in Caracas', () => {
    expect(resolveOrderPeriodDates('today', referenceDate)).toEqual({
      createdFrom: '2026-07-13',
      createdTo: '2026-07-13',
    });
  });

  it('pins today to Caracas for mid-afternoon Venezuela', () => {
    expect(resolveOrderPeriodDates('today', new Date('2026-07-15T18:00:00.000Z'))).toEqual({
      createdFrom: '2026-07-15',
      createdTo: '2026-07-15',
    });
  });

  it('returns this week range (Monday to Sunday) in Caracas', () => {
    const wednesday = new Date('2026-07-15T18:00:00.000Z');
    expect(resolveOrderPeriodDates('thisWeek', wednesday)).toEqual({
      createdFrom: '2026-07-13',
      createdTo: '2026-07-19',
    });
  });

  it('returns this week range when reference is Sunday Caracas', () => {
    const sunday = new Date('2026-07-19T18:00:00.000Z');
    expect(resolveOrderPeriodDates('thisWeek', sunday)).toEqual({
      createdFrom: '2026-07-13',
      createdTo: '2026-07-19',
    });
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

describe('getCaracasDateParts', () => {
  it('maps UTC evening to same Caracas calendar day', () => {
    expect(getCaracasDateParts(new Date('2026-07-15T18:38:07.000Z'))).toEqual({
      day: 15,
      month: 7,
      year: 2026,
    });
  });
});
