import type { PaymentMethod } from '../types/order';

export function isMegasoftP2cCheckout(
  megasoftEnabled: boolean | undefined,
  paymentMethod: PaymentMethod | undefined,
): boolean {
  return megasoftEnabled === true && paymentMethod === 'mobilePayment';
}

export function isScreenshotTooLarge(fileSizeBytes: number): boolean {
  return fileSizeBytes > 500 * 1024;
}

export function getInventoryMessage(changeCount: number): string | null {
  if (changeCount === 0) return null;
  return `La orden fue actualizada por inventario (${changeCount} ajuste${changeCount > 1 ? 's' : ''}).`;
}
