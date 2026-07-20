export const DELIVERY_MOTORCYCLE_PRIMARY = '#97BD11';
export const DELIVERY_MOTORCYCLE_SRC = '/delivery_motorcycle.png';

/** DOM node for Mapbox GL markers (same look as the React icon). */
export function createDeliveryMotorcycleMarkerElement(): HTMLDivElement {
  const size = 36;
  const iconSize = 24;
  const element = document.createElement('div');
  element.setAttribute('aria-label', 'Repartidor');
  element.setAttribute('data-testid', 'delivery-motorcycle-marker');
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.borderRadius = '9999px';
  element.style.background = '#ffffff';
  element.style.border = `2px solid ${DELIVERY_MOTORCYCLE_PRIMARY}`;
  element.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';
  element.style.cursor = 'default';

  const img = document.createElement('img');
  img.src = DELIVERY_MOTORCYCLE_SRC;
  img.alt = 'Repartidor';
  img.width = iconSize;
  img.height = iconSize;
  img.style.objectFit = 'contain';
  img.style.display = 'block';
  element.appendChild(img);

  return element;
}
