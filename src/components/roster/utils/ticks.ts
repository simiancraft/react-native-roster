import type { Window, WindowSpec } from '../../../core';
import { dayColumnsFor } from '../../../core';
import { offsetAt } from '../../../core/zone';
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
  const step = minuteStep * 60_000;
  function add(time: number, label: string, kind: RosterTick['kind']) {
    ticks.push({ time, x: ((time - window.start) / 60_000) * projection.pxPerMinute, label, kind });
  }
  const timeLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: spec.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  for (const day of dayColumnsFor(window, spec.timezone)) {
    const start = Math.max(day.start, window.start);
    add(start, `${day.label} ${day.localDate}`, 'day');
    if (spec.span === 'month' || (spec.span === 'week' && minuteStep * projection.pxPerMinute < 40))
      continue;
    // Each transition starts a new constant-offset segment. Positive deltas skip
    // wall minutes; negative deltas emit both absolute occurrences of a repeat.
    let segmentStart = day.start;
    // UTC wall coordinates retain the actual start minute even after a midnight skip.
    let offset = offsetAt(day.start, spec.timezone);
    for (const boundary of [...day.transitions, { at: day.end, deltaMinutes: 0 }]) {
      const wall = Math.max(start, segmentStart) + offset;
      const end = Math.min(boundary.at, window.end);
      for (let time = Math.ceil(wall / step) * step - offset; time < end; time += step) {
        if (time === start) continue;
        add(time, timeLabel.format(time), 'time');
      }
      segmentStart = boundary.at;
      // The origin already includes the part of a boundary skip after midnight.
      if (boundary.at > day.start) offset += boundary.deltaMinutes * 60_000;
    }
  }
  tickCache.set(key, ticks);
  return ticks;
}
