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

export function rangeLabel(start: number, end: number, timezone: string): string {
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
  });
  const year = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric' });
  return `${format.format(start)} to ${format.format(end - 1)}, ${year.format(start)}`;
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
