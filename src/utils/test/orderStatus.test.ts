import { describe, expect, it } from 'vitest';

import type { OrderStatus } from '../../types/order';

import {
  canCancelOrder,
  formatOrderStatusChangeMessage,
  formatOrderStatusLabel,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
} from '../orderStatus';

describe('canCancelOrder', () => {
  it('allows cancellable statuses', () => {
    expect(canCancelOrder('pending')).toBe(true);
    expect(canCancelOrder('paymentPendingConfirmation')).toBe(true);
    expect(canCancelOrder('paymentConfirmed')).toBe(true);
    expect(canCancelOrder('preparing')).toBe(true);
    expect(canCancelOrder('readyForDelivery')).toBe(true);
    expect(canCancelOrder('assignedToDeliveryDriver')).toBe(true);
    expect(canCancelOrder('delivering')).toBe(true);
  });

  it('denies non-cancellable statuses', () => {
    expect(canCancelOrder('delivered')).toBe(false);
    expect(canCancelOrder('cancelled' as OrderStatus)).toBe(false);
  });
});

describe('ORDER_STATUS_FLOW', () => {
  it('includes every OrderStatus exactly once', () => {
    const labelKeys = Object.keys(ORDER_STATUS_LABELS).sort() as OrderStatus[];
    expect([...ORDER_STATUS_FLOW].sort()).toEqual(labelKeys);
    expect(new Set(ORDER_STATUS_FLOW).size).toBe(ORDER_STATUS_FLOW.length);
  });

  it('places paymentPendingConfirmation between pending and paymentConfirmed', () => {
    expect(ORDER_STATUS_FLOW.indexOf('paymentPendingConfirmation')).toBeGreaterThan(
      ORDER_STATUS_FLOW.indexOf('pending')
    );
    expect(ORDER_STATUS_FLOW.indexOf('paymentConfirmed')).toBeGreaterThan(
      ORDER_STATUS_FLOW.indexOf('paymentPendingConfirmation')
    );
    expect(ORDER_STATUS_LABELS.paymentPendingConfirmation).toBe('Pago por confirmar');
  });

  it('includes readyForDelivery between preparing and assigned', () => {
    expect(ORDER_STATUS_FLOW).toContain('readyForDelivery');
    expect(ORDER_STATUS_LABELS.readyForDelivery).toBe('Lista para Reparto');
  });
});

describe('formatOrderStatusLabel', () => {
  it('returns Spanish label for known status', () => {
    expect(formatOrderStatusLabel('pending')).toBe('Pendiente');
    expect(formatOrderStatusLabel('paymentPendingConfirmation')).toBe('Pago por confirmar');
  });

  it('returns raw status for unknown values', () => {
    expect(formatOrderStatusLabel('unknown')).toBe('unknown');
  });
});

describe('formatOrderStatusChangeMessage', () => {
  it('formats change message in Spanish', () => {
    expect(formatOrderStatusChangeMessage('pending', 'paymentPendingConfirmation')).toBe(
      'Tu orden cambió de Pendiente a Pago por confirmar'
    );
  });
});
