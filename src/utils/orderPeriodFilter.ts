export type OrderPeriodFilter = 'all' | 'currentMonth' | 'lastThreeMonths' | 'year2025';

export const ORDER_PERIOD_OPTIONS: { label: string; value: OrderPeriodFilter }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Mes actual', value: 'currentMonth' },
  { label: 'Últimos tres meses', value: 'lastThreeMonths' },
  { label: '2025', value: 'year2025' },
];

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function resolveOrderPeriodDates(
  period: OrderPeriodFilter,
  referenceDate: Date = new Date(),
): { createdFrom?: string; createdTo?: string } {
  if (period === 'all') {
    return {};
  }

  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  if (period === 'currentMonth') {
    return {
      createdFrom: formatDate(new Date(year, month, 1)),
      createdTo: formatDate(new Date(year, month + 1, 0)),
    };
  }

  if (period === 'lastThreeMonths') {
    return {
      createdFrom: formatDate(new Date(year, month - 2, 1)),
      createdTo: formatDate(new Date(year, month + 1, 0)),
    };
  }

  return {
    createdFrom: '2025-01-01',
    createdTo: '2025-12-31',
  };
}
