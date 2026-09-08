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
  const delta = transition.deltaMinutes;
  const start = Math.max(0, delta > 0 ? minute - delta : minute);
  const end = Math.min(1440, delta < 0 ? minute - delta : minute);
  const pxPerMinute = projection.pxPerHour / 60;
  const y = start * pxPerMinute;
  return {
    y,
    dividerY: nowPosition(projection, transition.at)?.y ?? y,
    height: Math.max(0, end - start) * pxPerMinute,
    width: projection.columnWidth,
  };
}

export function nowPosition(projection: ScheduleProjection, now: number | null) {
  if (now !== null) {
    for (const [column, day] of projection.days.entries()) {
      for (const piece of scalePieces(day, projection.viewTimezone)) {
        if (now >= piece.start && now < piece.end)
          return {
            column,
            y:
              ((piece.minute + ((now - piece.start) / 60_000) * piece.scale) *
                projection.pxPerHour) /
              60,
          };
      }
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
