export const DESTINATION_GPS_PRIMARY = '#97BD11';

/** DOM node for Mapbox GL destination pin (teardrop + white hole, brand primary). */
export function createDestinationGpsMarkerElement(options?: {
  cursor?: string;
}): HTMLDivElement {
  const width = 28;
  const height = 36;
  const element = document.createElement('div');
  element.setAttribute('aria-label', 'Destino');
  element.setAttribute('data-testid', 'destination-gps-marker');
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  element.style.cursor = options?.cursor ?? 'default';
  element.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))';
  element.style.lineHeight = '0';
  element.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${width}" height="${height}" aria-hidden="true">
  <path fill="${DESTINATION_GPS_PRIMARY}" d="M12 0C5.925 0 1 4.925 1 11c0 7.5 9.2 18.4 10.35 19.7a1 1 0 0 0 1.3 0C13.8 29.4 23 18.5 23 11 23 4.925 18.075 0 12 0z"/>
  <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
</svg>`;
  return element;
}
