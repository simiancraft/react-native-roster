import type { DayColumn, Transition } from '../../../core';
import { scalePieces } from '../../../core/scale';
import { dateEpoch, dateString, dayMilliseconds, wallTime } from '../../../core/zone';
import type { ScheduleProjection, ScheduleWindowSpec } from '../schedule.types';

export function transitionBounds(
  day: DayColumn,
  transition: Transition,
  projection: ScheduleProjection,
) {
  const minute =
    (wallTime(transition.at, projection.viewTimezone) - dateEpoch(day.localDate)) / 60_000;
  const start = transition.deltaMinutes > 0 ? minute - transition.deltaMinutes : minute;
  const end = start + Math.abs(transition.deltaMinutes);
  const y = (Math.max(0, start) * projection.pxPerHour) / 60;
  return {
    y,
    height: (Math.max(0, Math.min(1440, end) - Math.max(0, start)) * projection.pxPerHour) / 60,
    width: projection.columnWidth,
  };
}

export function nowPosition(projection: ScheduleProjection, now: number | null) {
  if (now === null) return null;
  for (const [column, day] of projection.days.entries()) {
    for (const piece of scalePieces(day, projection.viewTimezone)) {
      if (now >= piece.start && now < piece.end)
        return {
          column,
          y:
            ((piece.minute + ((now - piece.start) / 60_000) * piece.scale) * projection.pxPerHour) /
            60,
        };
    }
  }
  return null;
}

export function headerDates(spec: ScheduleWindowSpec, days: DayColumn[]) {
  let start = dateEpoch(spec.anchorDate);
  if (spec.span === 'week') {
    const weekday = (new Date(start).getUTCDay() + 6) % 7;
    start -= ((weekday - (spec.wkst ?? 0) + 7) % 7) * dayMilliseconds;
  }
  return Array.from({ length: spec.span === 'week' ? 7 : 1 }, (_, index) => {
    const localDate = dateString(start + index * dayMilliseconds);
    return { localDate, day: days.find((day) => day.localDate === localDate) };
  });
}
