export const UNLIMITED_ORDER_MAX = 9999;

export function getMaxOrderQuantity(product: { stockQuantity?: number | null }): number {
  if (product.stockQuantity === null || product.stockQuantity === undefined) {
    return UNLIMITED_ORDER_MAX;
  }
  return Math.max(0, product.stockQuantity);
}
