export function getMapboxAccessToken(): string {
  return import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim() ?? '';
}

export const CARACAS_CENTER: [number, number] = [-66.9, 10.48];

export function formatTrackingDistance(meters: null | number | undefined): string | null {
  if (meters == null || Number.isNaN(meters)) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatTrackingEta(seconds: null | number | undefined): string | null {
  if (seconds == null || Number.isNaN(seconds)) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `Aprox. ${minutes} min`;
}

export function formatTrackingFreshness(
  serverReceivedAt: null | string | undefined,
  isStale: boolean
): string {
  if (!serverReceivedAt) return 'Sin ubicación reciente';
  const receivedMs = Date.parse(serverReceivedAt);
  if (Number.isNaN(receivedMs)) return 'Sin ubicación reciente';
  const ageSeconds = Math.max(0, Math.round((Date.now() - receivedMs) / 1000));
  if (isStale) return `Ubicación desactualizada (hace ${ageSeconds}s)`;
  return `Actualizado hace ${ageSeconds}s`;
}
