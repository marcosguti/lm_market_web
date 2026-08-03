import { describe, expect, it } from 'vitest';

import {
  createDestinationGpsMarkerElement,
  DESTINATION_GPS_PRIMARY,
} from '../marker';

describe('DestinationGpsIcon marker', () => {
  it('uses brand primary and exposes a stable test id', () => {
    expect(DESTINATION_GPS_PRIMARY).toBe('#97BD11');

    const el = createDestinationGpsMarkerElement({ cursor: 'grab' });
    expect(el.getAttribute('data-testid')).toBe('destination-gps-marker');
    expect(el.getAttribute('aria-label')).toBe('Destino');
    expect(el.style.cursor).toBe('grab');
    expect(el.innerHTML).toContain(DESTINATION_GPS_PRIMARY);
    expect(el.innerHTML).toContain('<circle');
    expect(el.textContent).not.toContain('📍');
  });
});
