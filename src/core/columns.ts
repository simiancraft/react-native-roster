import { registerCacheClear } from './cache';
import { touch, trim } from './lru';
import type { DayColumn, Window } from './types';
import {
  dateEpoch,
  dateString,
  dayMilliseconds,
  localDateAt,
  startOfDate,
  transitionsBetween,
} from './zone';

export const dayColumnCacheLimit = 2_000;
export const dayColumnCache = new Map<string, DayColumn | null>();

function clearDayColumnCache(): void {
  dayColumnCache.clear();
}

registerCacheClear(clearDayColumnCache);

export function dayColumnsFor(window: Window, timezone: string): DayColumn[] {
  const days: DayColumn[] = [];
  if (window.start >= window.end) return days;
  let localDate = localDateAt(window.start, timezone);
  let start = startOfDate(localDate, timezone);
  // After a rollback across midnight, the wall date can lag the column whose
  // first instant has already passed. Walk until the next absolute date start.
  while (start < window.end) {
    const nextDate = dateString(dateEpoch(localDate) + dayMilliseconds);
    const end = startOfDate(nextDate, timezone);
    const key = JSON.stringify([localDate, timezone]);
    let day = dayColumnCache.get(key);
    if (day === undefined) {
      day =
        start < end
          ? {
              start,
              end,
              localDate,
              label: new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                weekday: 'short',
              }).format(start),
              // Boundary transitions describe wall bands; absolute bounds stay exclusive.
              transitions: transitionsBetween(start - 1, end + 1, timezone),
            }
          : null;
      touch(dayColumnCache, key, day);
      trim(dayColumnCache, dayColumnCacheLimit);
    } else {
      touch(dayColumnCache, key, day);
    }
    if (day && day.end > window.start) days.push(day);
    localDate = nextDate;
    start = end;
  }
  return days;
}
