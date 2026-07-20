import { describe, expect, it } from 'vitest';

import {
  clampToDeliveryCityBounds,
  DELIVERY_CITY_LABELS,
  isDeliveryCitySlug,
  isInsideDeliveryCityBounds,
} from '../deliveryCities';

describe('deliveryCities', () => {
  it('recognizes supported city slugs', () => {
    expect(isDeliveryCitySlug('merida')).toBe(true);
    expect(isDeliveryCitySlug('tovar')).toBe(true);
    expect(isDeliveryCitySlug('caracas')).toBe(false);
    expect(isDeliveryCitySlug(null)).toBe(false);
  });

  it('exposes human labels', () => {
    expect(DELIVERY_CITY_LABELS.merida).toContain('Mérida');
    expect(DELIVERY_CITY_LABELS.tovar).toContain('Tovar');
  });

  it('rejects Lagunillas/Sucre area and clamps into merida bounds', () => {
    expect(isInsideDeliveryCityBounds('merida', 8.51, -71.39)).toBe(false);
    const clamped = clampToDeliveryCityBounds('merida', 8.51, -71.39);
    expect(isInsideDeliveryCityBounds('merida', clamped.latitude, clamped.longitude)).toBe(true);
  });

  it('keeps store corridor pins inside merida', () => {
    expect(isInsideDeliveryCityBounds('merida', 8.598136, -71.150426)).toBe(true);
    expect(isInsideDeliveryCityBounds('merida', 8.556639, -71.198714)).toBe(true);
  });
});
