import { describe, expect, it } from 'vitest';

import { formatNotificationBody, formatNotificationTitle } from '../notification';

describe('formatNotificationBody', () => {
  it('uses payload for ORDER_STATUS_CHANGED', () => {
    expect(
      formatNotificationBody('', { previousStatus: 'pending', newStatus: 'preparing' }, 'ORDER_STATUS_CHANGED'),
    ).toBe('Tu orden cambió de Pendiente a Preparando');
  });

  it('parses legacy body format', () => {
    expect(formatNotificationBody('Tu orden cambió de pending a preparing')).toBe(
      'Tu orden cambió de Pendiente a Preparando',
    );
  });

  it('replaces inline status tokens', () => {
    expect(formatNotificationBody('Estado: delivered')).toBe('Estado: Entregada');
  });
});

describe('formatNotificationTitle', () => {
  it('prefixes title with short order id', () => {
    expect(
      formatNotificationTitle('Actualización de orden', 'b582331c-1234-5678-90ab-cdef12345678'),
    ).toBe('#b582331c · Actualización de orden');
  });

  it('returns title unchanged when order id is missing', () => {
    expect(formatNotificationTitle('Actualización de orden', null)).toBe('Actualización de orden');
  });
});
