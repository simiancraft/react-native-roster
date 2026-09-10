import type { Gap, Interval, Window } from '../../core';
import { sourceSpans } from '../../core/spans';

export function net(
  includes: Interval[],
  excludes: Interval[],
  window: Window,
): { intervals: Interval[]; gaps: Gap[] } {
  const covered = sourceSpans(includes, window);
  const removed = sourceSpans(excludes, window);
  const intervals: Interval[] = [];
  const gaps: Gap[] = [];
  let first = 0;
  for (const include of covered) {
    let start = include.start;
    while (first < removed.length && (removed[first] as Gap).end <= start) first++;
    for (let i = first; i < removed.length; i++) {
      const exclude = removed[i] as Gap;
      if (exclude.start >= include.end) break;
      if (start < exclude.start)
        intervals.push({ start, end: exclude.start, sources: include.sources });
      const end = Math.min(include.end, exclude.end);
      gaps.push({ start: Math.max(start, exclude.start), end, sources: exclude.sources });
      start = end;
    }
    if (start < include.end) intervals.push({ start, end: include.end, sources: include.sources });
  }
  // Include source changes cannot split an otherwise identical removed span.
  return { intervals, gaps: sourceSpans(gaps, window) };
}
