import { describe, expect, it } from 'vitest';

import { getMaxOrderQuantity, UNLIMITED_ORDER_MAX } from '../cartStock';

describe('getMaxOrderQuantity', () => {
  it('returns unlimited when stockQuantity is null', () => {
    expect(getMaxOrderQuantity({ stockQuantity: null })).toBe(UNLIMITED_ORDER_MAX);
  });

  it('clamps negative stock to zero', () => {
    expect(getMaxOrderQuantity({ stockQuantity: -3 })).toBe(0);
  });

  it('returns stockQuantity when positive', () => {
    expect(getMaxOrderQuantity({ stockQuantity: 5 })).toBe(5);
  });
});
