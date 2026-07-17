/** Ant Design DatePicker display format (date-only). */
export const DATE_PICKER_FORMAT = 'DD/MM/YYYY';

const DISPLAY_TIME_ZONE = 'America/Caracas';

function toDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function getParts(date: Date): Record<string, string> {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: DISPLAY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );
}

/** Date-only display: DD/MM/YYYY (America/Caracas). Empty → em dash. */
export function formatDate(value: Date | null | string | undefined): string {
  if (value == null || value === '') return '—';
  const date = toDate(value);
  if (!date) return '—';
  const parts = getParts(date);
  return `${parts.day}/${parts.month}/${parts.year}`;
}

/** Datetime display: DD/MM/YYYY HH:mm AM/PM (America/Caracas). Empty → em dash. */
export function formatDateTime(value: Date | null | string | undefined): string {
  if (value == null || value === '') return '—';
  const date = toDate(value);
  if (!date) return '—';
  const parts = getParts(date);
  const hour = pad2(Number(parts.hour));
  const minute = parts.minute;
  const period = (parts.dayPeriod ?? '').toUpperCase().replace(/\./g, '').replace(/\s+/g, '');
  const ampm = period === 'AM' || period === 'A' ? 'AM' : 'PM';
  return `${parts.day}/${parts.month}/${parts.year} ${hour}:${minute} ${ampm}`;
}
