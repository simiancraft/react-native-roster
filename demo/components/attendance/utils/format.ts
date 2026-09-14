export function clockLabel(time: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(time);
}

export function offsetLabel(actual: number, planned: number): string {
  const minutes = (actual - planned) / 60_000;
  if (minutes === 0) return 'on plan';
  if (minutes < 0) return `${-minutes} min early`;
  return `${minutes} min late`;
}

export function dateLabel(time: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(time);
}
