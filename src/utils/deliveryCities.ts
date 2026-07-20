export const DELIVERY_CITY_SLUGS = ['merida', 'tovar'] as const;

export type DeliveryCitySlug = (typeof DELIVERY_CITY_SLUGS)[number];

export type DeliveryCityBounds = {
  east: number;
  north: number;
  south: number;
  west: number;
};

/** Keep in sync with API `src/config/delivery.ts`. */
export const DELIVERY_CITY_BOUNDS: Record<DeliveryCitySlug, DeliveryCityBounds> = {
  merida: { east: -71.1, north: 8.66, south: 8.53, west: -71.25 },
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

export function isInsideDeliveryCityBounds(
  city: DeliveryCitySlug,
  latitude: number,
  longitude: number
): boolean {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  const b = DELIVERY_CITY_BOUNDS[city];
  return latitude >= b.south && latitude <= b.north && longitude >= b.west && longitude <= b.east;
}

export function clampToDeliveryCityBounds(
  city: DeliveryCitySlug,
  latitude: number,
  longitude: number
): { latitude: number; longitude: number } {
  const b = DELIVERY_CITY_BOUNDS[city];
  return {
    latitude: Math.min(b.north, Math.max(b.south, latitude)),
    longitude: Math.min(b.east, Math.max(b.west, longitude)),
  };
}
