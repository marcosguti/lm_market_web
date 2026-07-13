export function formatShortOrderId(orderId: string): string {
  const segment = orderId.split('-')[0]?.trim() || orderId.trim();
  return `#${segment}`;
}
