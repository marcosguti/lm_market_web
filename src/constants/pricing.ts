export const USD_PRICE = 600;

export function usdToBs(amountUsd: number): number {
  return Number((amountUsd * USD_PRICE).toFixed(2));
}

/** @deprecated Use usdToBs */
export function orderTotalToBs(totalUsd: number): number {
  return usdToBs(totalUsd);
}

export function formatBs(amountUsd: number): string {
  return usdToBs(amountUsd).toLocaleString('es-VE', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}
