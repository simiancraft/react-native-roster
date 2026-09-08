import type { DayColumn, Window } from './types';
import {
  dateEpoch,
  dateString,
  dayMilliseconds,
  localDateAt,
  startOfDate,
  transitionsBetween,
} from './zone';

// Unbounded, like the date-start memo: zone data is stable for this runtime,
// and retaining visited days avoids probing again on pointer and navigation revisits.
const columns = new Map<string, DayColumn | null>();

export function dayColumnsFor(window: Window, timezone: string): DayColumn[] {
  const days: DayColumn[] = [];
  if (window.start >= window.end) return days;
  let localDate = localDateAt(window.start, timezone);
  const lastDate = localDateAt(window.end - 1, timezone);
  while (localDate <= lastDate) {
    const nextDate = dateString(dateEpoch(localDate) + dayMilliseconds);
    const key = JSON.stringify([localDate, timezone]);
    let day = columns.get(key);
    if (day === undefined) {
      const start = startOfDate(localDate, timezone);
      const end = startOfDate(nextDate, timezone);
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
              transitions: transitionsBetween(start - 1, end, timezone),
            }
          : null;
      columns.set(key, day);
    }
    if (day) days.push(day);
    localDate = nextDate;
  }
  return days;
}
