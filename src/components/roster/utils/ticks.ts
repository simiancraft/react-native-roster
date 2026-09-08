import type { Window, WindowSpec } from '../../../core';
import { dayColumnsFor } from '../../../core';
import type { RosterProjection, RosterTick } from '../roster.types';

// Like day columns, ticks retain visited content keys for this runtime.
const tickCache = new Map<string, RosterTick[]>();

export function ticksFor(
  window: Window,
  spec: WindowSpec,
  projection: RosterProjection,
  minuteStep: number,
): RosterTick[] {
  if (!Number.isInteger(minuteStep) || minuteStep <= 0 || 60 % minuteStep !== 0)
    throw new RangeError('minuteStep must be a positive divisor of 60');
  const key = JSON.stringify([
    window.start,
    window.end,
    spec.timezone,
    spec.span,
    minuteStep,
    projection.pxPerMinute,
  ]);
  const cached = tickCache.get(key);
  if (cached) return cached;
  const ticks: RosterTick[] = [];
  const days = dayColumnsFor(window, spec.timezone);
  const timeLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: spec.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  for (const day of days) {
    const start = Math.max(day.start, window.start);
    ticks.push({
      time: start,
      x: ((start - window.start) / 60_000) * projection.pxPerMinute,
      label: `${day.label} ${day.localDate}`,
      kind: 'day',
    });
    if (spec.span === 'month' || (spec.span === 'week' && minuteStep * projection.pxPerMinute < 40))
      continue;
    // Each transition starts a new constant-offset segment. Positive deltas skip
    // wall minutes; negative deltas emit both absolute occurrences of a repeat.
    let segmentStart = day.start;
    let offsetMinutes = 0;
    for (const boundary of [...day.transitions, { at: day.end, deltaMinutes: 0 }]) {
      const from = Math.max(start, segmentStart);
      const end = Math.min(boundary.at, window.end);
      const wallMinute = (from - day.start) / 60_000 + offsetMinutes;
      const firstMinute = Math.ceil(wallMinute / minuteStep) * minuteStep;
      const first = day.start + (firstMinute - offsetMinutes) * 60_000;
      for (let time = first; time < end; time += minuteStep * 60_000) {
        if (time === start) continue;
        ticks.push({
          time,
          x: ((time - window.start) / 60_000) * projection.pxPerMinute,
          label: timeLabel.format(time),
          kind: 'time',
        });
      }
      segmentStart = boundary.at;
      offsetMinutes += boundary.deltaMinutes;
    }
  }
  tickCache.set(key, ticks);
  return ticks;
}
