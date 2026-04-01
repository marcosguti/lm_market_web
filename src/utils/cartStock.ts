export const UNLIMITED_ORDER_MAX = 9999;

export function getMaxOrderQuantity(product: { totalStock?: number | null }): number {
  if (product.totalStock === null || product.totalStock === undefined) {
    return UNLIMITED_ORDER_MAX;
  }
  return Math.max(0, product.totalStock);
}
