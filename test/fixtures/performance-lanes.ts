import type { expandRuleSet, RuleSet } from '../../src/adapters/rrule';
import type { Interval, Lane, Window } from '../../src/core';
import { workload } from './workload';

/** A daily rule bounds W's intervals; the dated include also exercises date cache entries. */
export function performanceRuleSet(hourend = 24): RuleSet {
  return {
    rules: [
      {
        id: 'workload-hours',
        kind: 'include',
        frequency: 'DAILY',
        dtstart: '2023-12-01',
        timezone: 'UTC',
        hourstart: 0,
        hourend,
      },
    ],
    dates: [
      {
        id: 'workload-date',
        kind: 'include',
        date: '2024-01-04',
        timezone: 'UTC',
        hourstart: 0,
        hourend: 1,
      },
    ],
  };
}

export function performanceLanes(
  window: Window,
  anchorDate: string,
  expand: typeof expandRuleSet,
  hourend: number,
  laneTimezone: string,
): Lane[] {
  const result = expand(performanceRuleSet(hourend), window);
  const original = workload();
  const shift = Date.parse(`${anchorDate}T00:00:00Z`) - original.window.start;
  function clip(intervals: Interval[]) {
    return intervals.flatMap((interval) =>
      result.intervals.flatMap((allowed) => {
        const start = Math.max(interval.start + shift, allowed.start);
        const end = Math.min(interval.end + shift, allowed.end);
        return start < end ? [{ ...interval, start, end }] : [];
      }),
    );
  }
  return original.lanes.map((lane, index) => ({
    ...lane,
    version: `${anchorDate}:${hourend}:${window.start}:${window.end}`,
    timezone: index === 199 ? laneTimezone : 'UTC',
    complete: result.complete,
    layers: lane.layers.map((layer) => ({
      ...layer,
      intervals: clip(layer.intervals),
      ...(layer.gaps ? { gaps: clip(layer.gaps) } : {}),
    })),
  }));
}
