export type OrderPeriodFilter =
  'all' | 'today' | 'thisWeek' | 'currentMonth' | 'lastThreeMonths' | 'year2025';

export const ORDER_PERIOD_OPTIONS: { label: string; value: OrderPeriodFilter }[] = [
  { label: 'Hoy', value: 'today' },
  { label: 'Esta semana', value: 'thisWeek' },
  { label: 'Mes actual', value: 'currentMonth' },
  { label: 'Últimos tres meses', value: 'lastThreeMonths' },
  { label: '2025', value: 'year2025' },
  { label: 'Todos', value: 'all' },
];

const BUSINESS_TIME_ZONE = 'America/Caracas';

type CalendarParts = { day: number; month: number; year: number };

function formatDateParts({ day, month, year }: CalendarParts): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Calendar Y/M/D in America/Caracas for an absolute instant. */
export function getCaracasDateParts(date: Date): CalendarParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  return { day, month, year };
}

/** JS weekday: 0=Sun … 6=Sat for the Caracas calendar day of `date`. */
function getCaracasWeekday(date: Date): number {
  const asUtcNoon = caracasPartsToUtcNoon(getCaracasDateParts(date));
  return asUtcNoon.getUTCDay();
}

function caracasPartsToUtcNoon({ day, month, year }: CalendarParts): Date {
  // Noon UTC keeps the calendar Y/M/D stable when adding days for week math.
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

function startOfWeekMondayCaracas(date: Date): CalendarParts {
  const parts = getCaracasDateParts(date);
  const weekday = getCaracasWeekday(date);
  const diff = weekday === 0 ? -6 : 1 - weekday;
  return addCalendarDays(parts, diff);
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function resolveOrderPeriodDates(
  period: OrderPeriodFilter,
  referenceDate: Date = new Date()
): { createdFrom?: string; createdTo?: string } {
  if (period === 'all') {
    return {};
  }

  const todayParts = getCaracasDateParts(referenceDate);

  if (period === 'today') {
    const today = formatDateParts(todayParts);
    return { createdFrom: today, createdTo: today };
  }

  if (period === 'thisWeek') {
    const weekStart = startOfWeekMondayCaracas(referenceDate);
    const weekEnd = addCalendarDays(weekStart, 6);
    return {
      createdFrom: formatDateParts(weekStart),
      createdTo: formatDateParts(weekEnd),
    };
  }

  if (period === 'currentMonth') {
    const { month, year } = todayParts;
    return {
      createdFrom: formatDateParts({ day: 1, month, year }),
      createdTo: formatDateParts({ day: lastDayOfMonth(year, month), month, year }),
    };
  }

  if (period === 'lastThreeMonths') {
    const { month, year } = todayParts;
    const startUtc = new Date(Date.UTC(year, month - 1 - 2, 1, 12, 0, 0, 0));
    const startParts = {
      day: 1,
      month: startUtc.getUTCMonth() + 1,
      year: startUtc.getUTCFullYear(),
    };
    return {
      createdFrom: formatDateParts(startParts),
      createdTo: formatDateParts({
        day: lastDayOfMonth(year, month),
        month,
        year,
      }),
    };
  }

  return {
    createdFrom: '2025-01-01',
    createdTo: '2025-12-31',
  };
}
