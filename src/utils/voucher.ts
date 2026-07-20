export const SUCCESSFUL_PAYMENT_VOUCHER_PREFIX = '¡El pago ha sido exitoso!';

function collapseInlineWhitespace(line: string): string {
  return line.trim().replace(/\s+/g, ' ');
}

export function formatSuccessfulPaymentVoucher(text: string): string {
  const normalized = normalizeVoucherText(text);
  if (!normalized) return SUCCESSFUL_PAYMENT_VOUCHER_PREFIX;
  return `${SUCCESSFUL_PAYMENT_VOUCHER_PREFIX}\n\n${normalized}`;
}

export function normalizeVoucherText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => collapseInlineWhitespace(line))
    .join('\n')
    .trim();
}
