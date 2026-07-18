export const DELIVERY_CITY_SLUGS = ['merida', 'tovar'] as const;

export type DeliveryCitySlug = (typeof DELIVERY_CITY_SLUGS)[number];

export const DELIVERY_CITY_BOUNDS: Record<
  DeliveryCitySlug,
  { east: number; north: number; south: number; west: number }
> = {
  merida: { east: -71.05, north: 8.68, south: 8.48, west: -71.28 },
  tovar: { east: -71.7, north: 8.38, south: 8.28, west: -71.82 },
};

export const DELIVERY_CITY_CENTER: Record<DeliveryCitySlug, { lat: number; lng: number }> = {
  merida: { lat: 8.5897, lng: -71.1561 },
  tovar: { lat: 8.3305, lng: -71.7575 },
};

export const DELIVERY_CITY_LABELS: Record<DeliveryCitySlug, string> = {
  merida: 'Mérida',
  tovar: 'Tovar',
};

export function isDeliveryCitySlug(value: null | string | undefined): value is DeliveryCitySlug {
  return Boolean(value && (DELIVERY_CITY_SLUGS as readonly string[]).includes(value));
}
