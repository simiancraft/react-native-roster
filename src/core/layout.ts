import { counts, layoutCache } from './cache';
import { coverageFor } from './coverage';
import { flagFor } from './flag';
import { laneKey, projectionKey } from './hash';
import { type ScalePiece, scalePieces } from './scale';
import { sourceSpans } from './spans';
import type { Interval, Lane, LaneGeometry, Layer, Projection, Rect, Window } from './types';

export function layoutLane(lane: Lane, window: Window, projection: Projection): LaneGeometry {
  const key = `${laneKey(lane, window)}|${projectionKey(projection)}`;
  let cached = layoutCache.get(key);
  const coverage = coverageFor(lane, window);
  const flag = flagFor(lane, window);
  if (cached) {
    counts.layout.cacheHits++;
  } else {
    counts.layout.runs++;
    const pieces =
      projection.orientation === 'columns'
        ? projection.days.map((day) => scalePieces(day, projection.viewTimezone))
        : [];
    const rects: Rect[] = [];
    const gapRects: Rect[] = [];
    for (const layer of lane.layers) {
      project(sourceSpans(layer.intervals, window), layer, window, projection, pieces, rects);
      project(sourceSpans(layer.gaps ?? [], window), layer, window, projection, pieces, gapRects);
    }
    cached = { rects, gapRects, assemblies: new WeakMap() };
    layoutCache.set(key, cached);
  }
  // Read the current flag and coverage above, then retain each complete assembly
  // by reference, including when a consumer revisits an earlier explicit flag.
  let assemblies = cached.assemblies.get(coverage);
  if (!assemblies) {
    assemblies = new Map();
    cached.assemblies.set(coverage, assemblies);
  }
  const previous = assemblies.get(flag);
  if (previous) return previous;
  const result = {
    laneId: lane.id,
    rects: cached.rects,
    gapRects: cached.gapRects,
    coverage,
    flag,
  };
  assemblies.set(flag, result);
  return result;
}

function project(
  spans: Interval[],
  layer: Layer,
  window: Window,
  projection: Projection,
  columns: ScalePiece[][],
  rects: Rect[],
): void {
  const inset = layer.style.inset ?? 0;
  if (projection.orientation === 'horizontal') {
    for (const span of spans) {
      rects.push({
        x: ((span.start - window.start) / 60_000) * projection.pxPerMinute,
        y: inset,
        width: ((span.end - span.start) / 60_000) * projection.pxPerMinute,
        height: Math.max(0, projection.rowHeight - 2 * inset),
        layerId: layer.id,
        z: layer.z,
        sources: span.sources,
      });
    }
    return;
  }
  // Both lists are ordered in absolute time; advance once through the columns.
  let firstSpan = 0;
  for (const [column, pieces] of columns.entries()) {
    for (const piece of pieces) {
      while (firstSpan < spans.length && (spans[firstSpan] as Interval).end <= piece.start)
        firstSpan++;
      for (let i = firstSpan; i < spans.length; i++) {
        const span = spans[i] as Interval;
        if (span.start >= piece.end) break;
        const start = Math.max(span.start, piece.start);
        const end = Math.min(span.end, piece.end);
        rects.push({
          x: inset,
          y:
            ((piece.minute + ((start - piece.start) / 60_000) * piece.scale) *
              projection.pxPerHour) /
            60,
          width: Math.max(0, projection.columnWidth - 2 * inset),
          height: (((end - start) / 60_000) * piece.scale * projection.pxPerHour) / 60,
          layerId: layer.id,
          z: layer.z,
          sources: span.sources,
          column,
        });
      }
    }
  }
}
