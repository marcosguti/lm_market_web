import { describe, expect, it } from 'vitest';

import {
  canCancelOrder,
  formatOrderStatusChangeMessage,
  formatOrderStatusLabel,
} from '../orderStatus';

describe('canCancelOrder', () => {
  it('allows cancellable statuses', () => {
    expect(canCancelOrder('pending')).toBe(true);
    expect(canCancelOrder('paymentConfirmed')).toBe(true);
    expect(canCancelOrder('preparing')).toBe(true);
  });

  it('denies non-cancellable statuses', () => {
    expect(canCancelOrder('delivered')).toBe(false);
    expect(canCancelOrder('outForDelivery')).toBe(false);
  });
});

describe('formatOrderStatusLabel', () => {
  it('returns Spanish label for known status', () => {
    expect(formatOrderStatusLabel('pending')).toBe('Pendiente');
  });

  it('returns raw status for unknown values', () => {
    expect(formatOrderStatusLabel('unknown')).toBe('unknown');
  });
});

describe('formatOrderStatusChangeMessage', () => {
  it('formats change message in Spanish', () => {
    expect(formatOrderStatusChangeMessage('pending', 'paymentConfirmed')).toBe(
      'Tu orden cambió de Pendiente a Pago Confirmado',
    );
  });
});
