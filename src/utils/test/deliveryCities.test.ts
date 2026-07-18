import { describe, expect, it } from 'vitest';

import { DELIVERY_CITY_LABELS, isDeliveryCitySlug } from '../deliveryCities';

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
});
