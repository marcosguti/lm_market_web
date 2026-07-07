import { describe, expect, it } from 'vitest';

import {
  getInventoryMessage,
  isMegasoftP2cCheckout,
  isScreenshotTooLarge,
} from '../checkoutPayment';

describe('isMegasoftP2cCheckout', () => {
  it('is true when Megasoft enabled and method is mobilePayment', () => {
    expect(isMegasoftP2cCheckout(true, 'mobilePayment')).toBe(true);
  });

  it('is false for cash when Megasoft enabled', () => {
    expect(isMegasoftP2cCheckout(true, 'cash')).toBe(false);
  });
});

describe('isScreenshotTooLarge', () => {
  it('rejects files over 500KB', () => {
    expect(isScreenshotTooLarge(500 * 1024 + 1)).toBe(true);
  });

  it('allows files at 500KB', () => {
    expect(isScreenshotTooLarge(500 * 1024)).toBe(false);
  });
});

describe('getInventoryMessage', () => {
  it('returns null when there are no changes', () => {
    expect(getInventoryMessage(0)).toBeNull();
  });

  it('formats plural inventory changes', () => {
    expect(getInventoryMessage(2)).toContain('2 ajustes');
  });
});
