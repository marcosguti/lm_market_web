import { describe, expect, it } from 'vitest';

import { getMaxOrderQuantity, UNLIMITED_ORDER_MAX } from '../cartStock';

describe('getMaxOrderQuantity', () => {
  it('returns unlimited max when stock is null', () => {
    expect(getMaxOrderQuantity({ totalStock: null })).toBe(UNLIMITED_ORDER_MAX);
  });

  it('returns zero for negative stock', () => {
    expect(getMaxOrderQuantity({ totalStock: -3 })).toBe(0);
  });

  it('returns stock for positive values', () => {
    expect(getMaxOrderQuantity({ totalStock: 5 })).toBe(5);
  });
});
