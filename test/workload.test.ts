import { expect, it } from 'bun:test';
import type { Projection } from '../src/core';
import {
  clearCoverageCache,
  clearLayoutCache,
  coverageFor,
  coverageStats,
  dayColumnsFor,
  layoutLane,
  layoutStats,
  resetStats,
} from '../src/core';
import { workload } from './fixtures/workload';

const horizontal: Projection = {
  orientation: 'horizontal',
  viewTimezone: 'UTC',
  pxPerMinute: 1,
  rowHeight: 40,
};

it('generates deterministic N-lane, W-day fixtures with bounded intervals and source depth', () => {
  const { lanes, window } = workload(3, 7, 42);
  expect(workload(3, 7, 42)).toEqual({ lanes, window });
  expect(workload(3, 7, 43)).not.toEqual({ lanes, window });
  expect(workload(0, 0).lanes).toEqual([]);
  expect(lanes).toHaveLength(3);
  expect(window.end - window.start).toBe(7 * 86_400_000);
  const columns: Projection = {
    orientation: 'columns',
    viewTimezone: 'UTC',
    pxPerHour: 60,
    columnWidth: 100,
    days: dayColumnsFor(window, 'UTC'),
  };
  for (const lane of lanes) {
    expect(lane.layers).toHaveLength(2);
    const intervals = lane.layers.flatMap((layer) => layer.intervals);
    for (let day = 0; day < 7; day++) {
      const start = window.start + day * 86_400_000;
      expect(
        intervals.filter(
          (interval) => interval.start >= start && interval.start < start + 86_400_000,
        ).length,
      ).toBeLessThanOrEqual(12);
    }
    for (const at of intervals.flatMap(({ start, end }) => [start, end])) {
      const sources = new Set(
        intervals
          .filter((interval) => interval.start <= at && at < interval.end)
          .flatMap((interval) =>
            interval.sources.map((source) => JSON.stringify([source.kind, source.id])),
          ),
      );
      expect(sources.size).toBeLessThanOrEqual(3);
    }
    for (const projection of [horizontal, columns]) {
      const geometry = layoutLane(lane, window, projection);
      expect(geometry.rects.length + geometry.gapRects.length).toBe(70);
      expect(geometry.rects).toHaveLength(63);
      expect(geometry.gapRects).toHaveLength(7);
    }
  }
  console.log(
    'Workload W density: 70 rects plus gap rects per lane per week (63 rects, 7 gap rects).',
  );
});

it('keeps target-cold workload W layout and coverage each below 16 ms', () => {
  const { lanes, window } = workload();
  expect(lanes).toHaveLength(200);
  clearLayoutCache();
  clearCoverageCache();
  resetStats();
  const visible = lanes.slice(0, 24);
  const layoutStart = performance.now();
  for (const lane of visible) layoutLane(lane, window, horizontal);
  const layoutMs = performance.now() - layoutStart;
  expect(layoutStats()).toEqual({ runs: 24, cacheHits: 0 });
  clearCoverageCache();
  resetStats();
  const coverageStart = performance.now();
  for (const lane of lanes) coverageFor(lane, window);
  const coverageMs = performance.now() - coverageStart;
  expect(coverageStats()).toEqual({ runs: 200, cacheHits: 0 });
  console.log(
    `Workload W target-cold baseline: layout 24 lanes ${layoutMs.toFixed(3)} ms; coverage 200 lanes ${coverageMs.toFixed(3)} ms; 15-minute ticks.`,
  );
  expect(layoutMs).toBeLessThan(16);
  expect(coverageMs).toBeLessThan(16);
  resetStats();
  for (const lane of visible) layoutLane(lane, window, horizontal);
  expect(layoutStats()).toEqual({ runs: 0, cacheHits: 24 });
  expect(coverageStats()).toEqual({ runs: 0, cacheHits: 24 });
});
