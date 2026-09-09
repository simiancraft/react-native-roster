const HOUR = 3_600_000;

export function timeLabel(time: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(time);
}

/** Compact hour label for dense axes: 9am, 12pm, 3:30pm. */
export function compactTimeLabel(time: number, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(time);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const minute = value('minute') === '00' ? '' : `:${value('minute')}`;
  return `${value('hour')}${minute}${value('dayPeriod').toLowerCase()}`;
}

export function dayLabel(time: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(time);
}

/** The most concise date: 9.9.26. */
export function conciseDate(time: number, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  }).formatToParts(time);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('month')}.${value('day')}.${value('year')}`;
}

export function rangeLabel(start: number, end: number, timezone: string): string {
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
  });
  const year = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric' });
  const last = end - 1;
  const single = format.format(start) === format.format(last);
  return single
    ? `${format.format(start)}, ${year.format(start)}`
    : `${format.format(start)} to ${format.format(last)}, ${year.format(start)}`;
}

export function conciseRangeLabel(start: number, end: number, timezone: string): string {
  const first = conciseDate(start, timezone);
  const last = conciseDate(end - 1, timezone);
  return first === last ? first : `${first} to ${last}`;
}

export function durationLabel(start: number, end: number): string {
  const hours = (end - start) / HOUR;
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return Number.isInteger(hours) ? `${hours} h` : `${hours.toFixed(1)} h`;
}

export function hoursLabel(hours: { start: number; end: number }): string {
  const clock = (hour: number) => {
    const suffix = hour >= 12 && hour < 24 ? 'pm' : 'am';
    const twelve = hour % 12 === 0 ? 12 : hour % 12;
    return `${twelve}${suffix}`;
  };
  return `${clock(hours.start)} to ${clock(hours.end)}`;
}

export function zoneShort(timezone: string): string {
  return timezone.split('/').pop()?.replace(/_/g, ' ') ?? timezone;
}
