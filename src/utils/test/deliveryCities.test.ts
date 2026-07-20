import { describe, expect, it } from 'vitest';

import {
  asCoordNumber,
  clampToDeliveryCityPolygon,
  DELIVERY_CITY_LABELS,
  isDeliveryCitySlug,
  isInsideDeliveryCityPolygon,
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

  it('rejects Lagunillas/Sucre and snaps outside pins to city center', () => {
    expect(isInsideDeliveryCityPolygon('merida', 8.51, -71.39)).toBe(false);
    const clamped = clampToDeliveryCityPolygon('merida', 8.51, -71.39);
    expect(isInsideDeliveryCityPolygon('merida', clamped.latitude, clamped.longitude)).toBe(true);
  });

  it('keeps store corridor pins inside merida polygon', () => {
    expect(isInsideDeliveryCityPolygon('merida', 8.598136, -71.150426)).toBe(true);
    expect(isInsideDeliveryCityPolygon('merida', 8.556639, -71.198714)).toBe(true);
  });

  it('keeps Tovar store inside polygon', () => {
    expect(isInsideDeliveryCityPolygon('tovar', 8.327331, -71.757007)).toBe(true);
  });

  it('coerces Decimal string coords for polygon checks', () => {
    expect(asCoordNumber('8.598136')).toBeCloseTo(8.598136);
    expect(asCoordNumber('-71.150426')).toBeCloseTo(-71.150426);
    expect(isInsideDeliveryCityPolygon('merida', '8.598136', '-71.150426')).toBe(true);
    const clamped = clampToDeliveryCityPolygon('merida', '8.598136', '-71.150426');
    expect(clamped.latitude).toBeCloseTo(8.598136);
    expect(clamped.longitude).toBeCloseTo(-71.150426);
  });
});
