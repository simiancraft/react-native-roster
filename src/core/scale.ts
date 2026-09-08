// A rect must never cross a scale boundary. Repeats have three boundaries:
// T - |delta|, T, and T + |delta|. Pieces serve layout and pointer inversion
// together so that both halves select the same absolute occurrence.
import type { DayColumn } from './types';
import { dateEpoch, wallTime } from './zone';

export type ScalePiece = { start: number; end: number; minute: number; scale: number };

export function scalePieces(day: DayColumn, timezone: string): ScalePiece[] {
  const boundaries = new Set([day.start, day.end]);
  const addBoundary = (time: number) =>
    boundaries.add(Math.max(day.start, Math.min(day.end, time)));
  for (const { at, deltaMinutes } of day.transitions) {
    addBoundary(at);
    if (deltaMinutes < 0) {
      const delta = -deltaMinutes * 60_000;
      addBoundary(at - delta);
      addBoundary(at + delta);
    }
  }
  const ordered = [...boundaries].sort((a, b) => a - b);
  const pieces: ScalePiece[] = [];
  const midnight = dateEpoch(day.localDate);
  for (let i = 0; i < ordered.length - 1; i++) {
    const start = ordered[i] as number;
    const end = ordered[i + 1] as number;
    let minute = (wallTime(start, timezone) - midnight) / 60_000;
    let scale = 1;
    for (const { at, deltaMinutes } of day.transitions) {
      const delta = -deltaMinutes * 60_000;
      if (delta > 0 && start >= at - delta && start < at + delta) {
        const repeatedStart = (wallTime(at, timezone) - midnight) / 60_000;
        // Clamp a repeat crossing midnight to the top edge. Compress its
        // surviving absolute span into the remaining wall-clock region so
        // layout and inversion agree where ordinary wall time resumes.
        const clipped = Math.max(0, -repeatedStart);
        const repeatStart = at - delta + clipped * 60_000;
        scale = (deltaMinutes + clipped) / (2 * deltaMinutes + clipped);
        minute = repeatedStart + clipped + ((start - repeatStart) / 60_000) * scale;
      }
    }
    pieces.push({ start, end, minute, scale });
  }
  return pieces;
}
