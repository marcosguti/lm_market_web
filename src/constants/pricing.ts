/** Fallback when payment config has not loaded yet. */
export const DEFAULT_USD_RATE = 600;

/** @deprecated Use DEFAULT_USD_RATE / live rate from ExchangeRateContext */
export const USD_PRICE = DEFAULT_USD_RATE;

export function usdToBs(amountUsd: number, rate: number = DEFAULT_USD_RATE): number {
  return Number((amountUsd * rate).toFixed(2));
}

/** @deprecated Use usdToBs */
export function orderTotalToBs(totalUsd: number, rate: number = DEFAULT_USD_RATE): number {
  return usdToBs(totalUsd, rate);
}

export function formatBs(amountUsd: number, rate: number = DEFAULT_USD_RATE): string {
  return usdToBs(amountUsd, rate).toLocaleString('es-VE', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

/** Prefer snapshotted order rate; otherwise live platform rate. */
export function resolveOrderUsdRate(
  order: { exchangeRate?: null | number },
  liveRate: number = DEFAULT_USD_RATE,
): number {
  if (order.exchangeRate !== null && order.exchangeRate !== undefined && order.exchangeRate > 0) {
    return order.exchangeRate;
  }
  return liveRate;
}

export function formatOrderTotalBs(
  order: { exchangeRate?: null | number; totalAmount: number; totalAmountBs?: null | number },
  liveRate: number = DEFAULT_USD_RATE,
): string {
  if (order.totalAmountBs !== null && order.totalAmountBs !== undefined) {
    return order.totalAmountBs.toLocaleString('es-VE', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  }
  return formatBs(order.totalAmount, resolveOrderUsdRate(order, liveRate));
}
