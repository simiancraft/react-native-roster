// Sweep boundaries once; reference counts preserve provenance through nested
// intervals and equal-time ends/starts. Labels never affect source identity.
import type { Interval, Source, Window } from './types';

type Boundary = { at: number; delta: number; sources: Source[] };

export function sourceSpans(intervals: Interval[], window: Window): Interval[] {
  const boundaries: Boundary[] = [];
  for (const interval of intervals) {
    const start = Math.max(interval.start, window.start);
    const end = Math.min(interval.end, window.end);
    if (start >= end) continue;
    boundaries.push({ at: start, delta: 1, sources: interval.sources });
    boundaries.push({ at: end, delta: -1, sources: interval.sources });
  }
  boundaries.sort((a, b) => a.at - b.at);
  const active = new Map<string, { count: number; source: Source }>();
  const spans: Interval[] = [];
  let depth = 0;
  let previous = window.start;
  let lastKeys = new Set<string>();
  let sourceDifference = 0;
  for (let i = 0; i < boundaries.length; ) {
    const at = (boundaries[i] as Boundary).at;
    if (depth > 0 && previous < at) {
      const last = spans.at(-1);
      if (last && last.end === previous && sourceDifference === 0) {
        last.end = at;
      } else {
        spans.push({
          start: previous,
          end: at,
          sources: [...active.values()].map((item) => item.source),
        });
        lastKeys = new Set(active.keys());
        sourceDifference = 0;
      }
    }
    while (i < boundaries.length && (boundaries[i] as Boundary).at === at) {
      const boundary = boundaries[i++] as Boundary;
      depth += boundary.delta;
      for (const source of boundary.sources) {
        const key = JSON.stringify([source.kind, source.id]);
        const item = active.get(key);
        const count = (item?.count ?? 0) + boundary.delta;
        // Track set differences incrementally so redundant overlap boundaries
        // do not copy or compare the full source set on an unchanged span.
        if ((count === 0) !== (item === undefined)) {
          sourceDifference += lastKeys.has(key) ? -boundary.delta : boundary.delta;
        }
        if (count === 0) active.delete(key);
        else active.set(key, { count, source: item?.source ?? source });
      }
    }
    previous = at;
  }
  return spans;
}
