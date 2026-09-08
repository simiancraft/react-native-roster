// Intl supplies offsets; UTC Date arithmetic supplies local-date arithmetic.
// Hourly probes bracket IANA transitions, then binary search keeps exact epoch
// boundaries, including historical second offsets. No host-local Date methods.
import type { Transition } from './types';

const formatters = new Map<string, Intl.DateTimeFormat>();
const starts = new Map<string, number>();
const minute = 60_000;
export const dayMilliseconds = 86_400_000;

export function wallTime(time: number, timezone: string): number {
  let formatter = formatters.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
      timeZone: timezone,
      era: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timezone, formatter);
  }
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(time)) parts[part.type] = part.value;
  const date = new Date(0);
  const year = parts.era === 'BC' ? 1 - Number(parts.year) : Number(parts.year);
  date.setUTCFullYear(year, Number(parts.month) - 1, Number(parts.day));
  date.setUTCHours(Number(parts.hour) % 24, Number(parts.minute), Number(parts.second), 0);
  return date.getTime() + (((time % 1000) + 1000) % 1000);
}

export function offsetAt(time: number, timezone: string): number {
  return wallTime(time, timezone) - time;
}

export function localDateAt(time: number, timezone: string): string {
  return dateString(wallTime(time, timezone));
}

export function dateString(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function dateEpoch(localDate: string): number {
  const time = Date.parse(`${localDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(localDate) ||
    !Number.isFinite(time) ||
    dateString(time) !== localDate
  ) {
    throw new RangeError('Expected a valid YYYY-MM-DD local date');
  }
  return time;
}

export function transitionsBetween(start: number, end: number, timezone: string): Transition[] {
  const transitions: Transition[] = [];
  let cursor = start;
  let offset = offsetAt(cursor, timezone);
  while (cursor < end) {
    const probe = Math.min(cursor + 60 * minute, end);
    const nextOffset = offsetAt(probe, timezone);
    if (nextOffset !== offset) {
      let low = cursor;
      let high = probe;
      while (high - low > 1) {
        const middle = Math.floor((low + high) / 2);
        if (offsetAt(middle, timezone) === offset) low = middle;
        else high = middle;
      }
      if (high < end) transitions.push({ at: high, deltaMinutes: (nextOffset - offset) / minute });
    }
    cursor = probe;
    offset = nextOffset;
  }
  return transitions;
}

export function startOfDate(localDate: string, timezone: string): number {
  const key = JSON.stringify([localDate, timezone]);
  const cached = starts.get(key);
  if (cached !== undefined) return cached;
  const target = dateEpoch(localDate);
  const start = target - 2 * dayMilliseconds;
  const end = target + 2 * dayMilliseconds;
  const boundaries = [start, ...transitionsBetween(start, end, timezone).map(({ at }) => at), end];
  let result = Infinity;
  for (let i = 0; i < boundaries.length - 1; i++) {
    const left = boundaries[i] as number;
    const right = boundaries[i + 1] as number;
    const candidate = Math.max(left, target - offsetAt(left, timezone));
    if (candidate < right) result = Math.min(result, candidate);
  }
  starts.set(key, result);
  return result;
}
