import { getCaracasDateParts } from './orderPeriodFilter';

export type ClientHistoryPeriod = 'all' | 'last30d' | 'last3m';

export const CLIENT_HISTORY_PERIOD_OPTIONS: {
  label: string;
  value: ClientHistoryPeriod;
}[] = [
  { label: 'últimos 30 días', value: 'last30d' },
  { label: 'últimos 3 meses', value: 'last3m' },
  { label: 'Todos', value: 'all' },
];

type CalendarParts = { day: number; month: number; year: number };

function formatDateParts({ day, month, year }: CalendarParts): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function caracasPartsToUtcNoon({ day, month, year }: CalendarParts): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

function addCalendarDays(parts: CalendarParts, deltaDays: number): CalendarParts {
  const utc = caracasPartsToUtcNoon(parts);
  utc.setUTCDate(utc.getUTCDate() + deltaDays);
  return {
    day: utc.getUTCDate(),
    month: utc.getUTCMonth() + 1,
    year: utc.getUTCFullYear(),
  };
}

/**
 * Resolves client Mis compras period presets to date-only strings (Caracas calendar).
 * `createdTo` is inclusive of today for rolling windows.
 */
export function resolveClientHistoryPeriodDates(
  period: ClientHistoryPeriod,
  referenceDate: Date = new Date()
): { createdFrom?: string; createdTo?: string } {
  if (period === 'all') {
    return {};
  }

  const todayParts = getCaracasDateParts(referenceDate);
  const createdTo = formatDateParts(todayParts);

  if (period === 'last30d') {
    const fromParts = addCalendarDays(todayParts, -29);
    return { createdFrom: formatDateParts(fromParts), createdTo };
  }

  // last3m: ~90 days inclusive window ending today
  const fromParts = addCalendarDays(todayParts, -89);
  return { createdFrom: formatDateParts(fromParts), createdTo };
}
