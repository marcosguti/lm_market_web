import { describe, expect, it } from 'vitest';

import {
  formatTrackingDistance,
  formatTrackingEta,
  formatTrackingFreshness,
} from '../mapboxToken';

describe('mapbox tracking formatters', () => {
  it('formats distance in meters and kilometers', () => {
    expect(formatTrackingDistance(450)).toBe('450 m');
    expect(formatTrackingDistance(2500)).toBe('2.5 km');
    expect(formatTrackingDistance(null)).toBeNull();
  });

  it('formats eta in minutes', () => {
    expect(formatTrackingEta(90)).toBe('Aprox. 2 min');
    expect(formatTrackingEta(30)).toBe('Aprox. 1 min');
  });

  it('formats freshness and stale warning', () => {
    const recent = new Date(Date.now() - 5000).toISOString();
    expect(formatTrackingFreshness(recent, false)).toMatch(/Actualizado hace \d+s/);
    expect(formatTrackingFreshness(recent, true)).toMatch(/Ubicación desactualizada/);
    expect(formatTrackingFreshness(null, false)).toBe('Sin ubicación reciente');
  });
});
