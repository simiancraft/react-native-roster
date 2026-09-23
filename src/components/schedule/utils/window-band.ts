import type { Window } from '../../../core';
import { scalePieces } from '../../../core/scale';
import type { ScheduleProjection, WindowBandInput } from '../schedule.types';

export function projectWindowBand(
  candidate: Window,
  window: Window,
  projection: ScheduleProjection,
): WindowBandInput[] {
  const bandStart = Math.max(candidate.start, window.start);
  const bandEnd = Math.min(candidate.end, window.end);
  if (bandStart >= bandEnd) return [];

  const pieces: WindowBandInput[] = [];
  for (const [column, day] of projection.days.entries()) {
    for (const piece of scalePieces(day, projection.viewTimezone)) {
      const start = Math.max(bandStart, day.start, piece.start);
      const end = Math.min(bandEnd, day.end, piece.end);
      if (start >= end) continue;
      pieces.push({
        day,
        column,
        start,
        end,
        x: 0,
        y:
          ((piece.minute + ((start - piece.start) / 60_000) * piece.scale) * projection.pxPerHour) /
          60,
        width: projection.columnWidth,
        height: (((end - start) / 60_000) * piece.scale * projection.pxPerHour) / 60,
      });
    }
  }
  return pieces;
}
