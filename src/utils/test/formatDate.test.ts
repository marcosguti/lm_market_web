import { describe, expect, it } from 'vitest';

import { DATE_PICKER_FORMAT, formatDate, formatDateTime } from '../formatDate';

describe('formatDateTime', () => {
  it('formats ISO timestamp in America/Caracas with AM/PM', () => {
    // 18:38 UTC = 14:38 Caracas
    expect(formatDateTime('2026-07-15T18:38:07.000Z')).toBe('15/07/2026 02:38 PM');
  });

  it('formats morning hours with AM', () => {
    // 12:05 UTC = 08:05 Caracas
    expect(formatDateTime('2026-07-15T12:05:00.000Z')).toBe('15/07/2026 08:05 AM');
  });

  it('returns em dash for empty values', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
    expect(formatDateTime('')).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats date-only in America/Caracas', () => {
    expect(formatDate('2026-07-15T18:38:07.000Z')).toBe('15/07/2026');
  });

  it('returns em dash for empty values', () => {
    expect(formatDate(null)).toBe('—');
  });
});

describe('DATE_PICKER_FORMAT', () => {
  it('is DD/MM/YYYY for Ant Design', () => {
    expect(DATE_PICKER_FORMAT).toBe('DD/MM/YYYY');
  });
});
