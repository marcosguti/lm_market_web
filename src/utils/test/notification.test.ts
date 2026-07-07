import { describe, expect, it } from 'vitest';

import { formatNotificationBody } from '../notification';

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
