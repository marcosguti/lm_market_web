import { describe, expect, it } from 'vitest';

import { formatShortOrderId } from '../orderId';

describe('formatShortOrderId', () => {
  it('returns first uuid segment prefixed with hash', () => {
    expect(formatShortOrderId('b582331c-1234-5678-9abc-def012345678')).toBe('#b582331c');
  });

  it('returns hash prefix for ids without hyphen', () => {
    expect(formatShortOrderId('custom-id')).toBe('#custom');
  });
});
