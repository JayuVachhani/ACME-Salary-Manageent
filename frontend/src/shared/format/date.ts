export function formatTimestampDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleDateString();
}

/** Effective dates are business dates, independent of the viewer's time zone. */
export function formatBusinessDate(value: string): string {
  const date = new Date(value + 'T00:00:00Z');
  return Number.isNaN(date.getTime())
    ? 'Unavailable'
    : new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}
