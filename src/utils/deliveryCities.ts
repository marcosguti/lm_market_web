export const DELIVERY_CITY_SLUGS = ['merida', 'tovar'] as const;

export type DeliveryCitySlug = (typeof DELIVERY_CITY_SLUGS)[number];

export type DeliveryCityBounds = {
  east: number;
  north: number;
  south: number;
  west: number;
};

/** Closed GeoJSON ring: [lng, lat][]. Keep in sync with API. */
export type DeliveryCityPolygon = Array<[number, number]>;

export const DELIVERY_CITY_POLYGONS: Record<DeliveryCitySlug, DeliveryCityPolygon> = {
  merida: [
    [-71.22, 8.64],
    [-71.14, 8.655],
    [-71.11, 8.62],
    [-71.12, 8.575],
    [-71.155, 8.548],
    [-71.205, 8.542],
    [-71.245, 8.555],
    [-71.25, 8.59],
    [-71.22, 8.64],
  ],
  tovar: [
    [-71.78, 8.345],
    [-71.74, 8.345],
    [-71.735, 8.325],
    [-71.745, 8.31],
    [-71.775, 8.315],
    [-71.78, 8.345],
  ],
};

export const DELIVERY_CITY_CENTER: Record<DeliveryCitySlug, { lat: number; lng: number }> = {
  merida: { lat: 8.5897, lng: -71.1561 },
  tovar: { lat: 8.3305, lng: -71.7575 },
};

export const DELIVERY_CITY_LABELS: Record<DeliveryCitySlug, string> = {
  merida: 'Mérida',
  tovar: 'Tovar',
};

function boundsFromPolygon(ring: DeliveryCityPolygon): DeliveryCityBounds {
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const [lng, lat] of ring) {
    if (lng < west) west = lng;
    if (lng > east) east = lng;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }
  return { east, north, south, west };
}

export const DELIVERY_CITY_BOUNDS: Record<DeliveryCitySlug, DeliveryCityBounds> = {
  merida: boundsFromPolygon(DELIVERY_CITY_POLYGONS.merida),
  tovar: boundsFromPolygon(DELIVERY_CITY_POLYGONS.tovar),
};

export function isDeliveryCitySlug(value: null | string | undefined): value is DeliveryCitySlug {
  return Boolean(value && (DELIVERY_CITY_SLUGS as readonly string[]).includes(value));
}

/** Coerce API/localStorage Decimal strings to finite numbers. */
export function asCoordNumber(value: unknown): null | number {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function isPointInPolygon(
  latitude: number | string,
  longitude: number | string,
  ring: DeliveryCityPolygon,
): boolean {
  const lat = asCoordNumber(latitude);
  const lng = asCoordNumber(longitude);
  if (lat === null || lng === null || ring.length < 3) {
    return false;
  }
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function isInsideDeliveryCityPolygon(
  city: DeliveryCitySlug,
  latitude: number | string,
  longitude: number | string,
): boolean {
  return isPointInPolygon(latitude, longitude, DELIVERY_CITY_POLYGONS[city]);
}

export function isInsideDeliveryCityBounds(
  city: DeliveryCitySlug,
  latitude: number | string,
  longitude: number | string,
): boolean {
  const lat = asCoordNumber(latitude);
  const lng = asCoordNumber(longitude);
  if (lat === null || lng === null) return false;
  const b = DELIVERY_CITY_BOUNDS[city];
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
}

/** Keep point if inside polygon; otherwise return city center. */
export function clampToDeliveryCityPolygon(
  city: DeliveryCitySlug,
  latitude: number | string,
  longitude: number | string,
): { latitude: number; longitude: number } {
  const lat = asCoordNumber(latitude);
  const lng = asCoordNumber(longitude);
  if (lat !== null && lng !== null && isInsideDeliveryCityPolygon(city, lat, lng)) {
    return { latitude: lat, longitude: lng };
  }
  const center = DELIVERY_CITY_CENTER[city];
  return { latitude: center.lat, longitude: center.lng };
}

export function clampToDeliveryCityBounds(
  city: DeliveryCitySlug,
  latitude: number | string,
  longitude: number | string,
): { latitude: number; longitude: number } {
  const lat = asCoordNumber(latitude) ?? DELIVERY_CITY_CENTER[city].lat;
  const lng = asCoordNumber(longitude) ?? DELIVERY_CITY_CENTER[city].lng;
  const b = DELIVERY_CITY_BOUNDS[city];
  return {
    latitude: Math.min(b.north, Math.max(b.south, lat)),
    longitude: Math.min(b.east, Math.max(b.west, lng)),
  };
}

export function deliveryCityPolygonGeoJson(city: DeliveryCitySlug) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [DELIVERY_CITY_POLYGONS[city]],
    },
  };
}

/** World rectangle with city polygon as a hole — dims outside the valid zone. */
export function deliveryCityMaskGeoJson(city: DeliveryCitySlug) {
  const outer: Array<[number, number]> = [
    [-180, -90],
    [180, -90],
    [180, 90],
    [-180, 90],
    [-180, -90],
  ];
  const hole = [...DELIVERY_CITY_POLYGONS[city]].reverse();
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [outer, hole],
    },
  };
}
