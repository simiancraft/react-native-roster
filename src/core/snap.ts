import { dayColumnsFor } from './columns';
import { scalePieces } from './scale';
import type { Projection, Window } from './types';
import { wallTime } from './zone';

export function snapToStep(time: number, minuteStep: number, timezone: string): number {
  if (!Number.isInteger(minuteStep) || minuteStep <= 0 || 60 % minuteStep !== 0) {
    throw new RangeError('minuteStep must be a positive divisor of 60');
  }
  const step = minuteStep * 60_000;
  const wall = wallTime(time, timezone);
  let result = time - (wall - Math.floor(wall / step) * step);
  const days = dayColumnsFor({ start: time, end: time + 1 }, timezone);
  for (const day of days) {
    for (const { at } of day.transitions) {
      if (at <= time) result = Math.max(result, at);
    }
  }
  return result;
}

export function timeAtY(
  projection: Extract<Projection, { orientation: 'columns' }>,
  columnIndex: number,
  y: number,
): number | null {
  const day = projection.days[columnIndex];
  if (!day || y < 0 || y >= 24 * projection.pxPerHour) return null;
  const minute = (y * 60) / projection.pxPerHour;
  for (const piece of scalePieces(day, projection.viewTimezone)) {
    if (
      minute >= piece.minute &&
      minute < piece.minute + ((piece.end - piece.start) / 60_000) * piece.scale
    ) {
      // Epoch addition can round an interior pointer to the exclusive boundary.
      return Math.min(
        piece.end - 1,
        piece.start + ((minute - piece.minute) * 60_000) / piece.scale,
      );
    }
  }
  return null;
}

/** Absolute time at true elapsed length; the window supplies the projection's origin. */
export function timeAtX(
  projection: Extract<Projection, { orientation: 'horizontal' }>,
  window: Window,
  x: number,
): number {
  return window.start + (x * 60_000) / projection.pxPerMinute;
}
