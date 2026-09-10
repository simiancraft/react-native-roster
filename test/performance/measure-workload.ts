import {
  clearCoverageCache,
  clearLayoutCache,
  coverageFor,
  coverageStats,
  layoutLane,
  layoutStats,
  resetStats,
} from '../../src/core';
import { workload } from '../fixtures/workload';

/** Median of 11 target-cold samples after five JIT warmups; cache clearing is untimed. */
export function measureWorkload() {
  const { lanes, window } = workload();
  const visible = lanes.slice(0, 24);
  const projection = {
    orientation: 'horizontal' as const,
    viewTimezone: 'UTC',
    pxPerMinute: 1,
    rowHeight: 40,
  };
  const layout: number[] = [];
  const coverage: number[] = [];
  for (let sample = 0; sample < 16; sample++) {
    clearLayoutCache();
    clearCoverageCache();
    resetStats();
    const start = performance.now();
    for (const lane of visible) layoutLane(lane, window, projection);
    layout.push(performance.now() - start);
    const layoutCount = layoutStats();
    clearCoverageCache();
    resetStats();
    const coverageStart = performance.now();
    for (const lane of lanes) coverageFor(lane, window);
    coverage.push(performance.now() - coverageStart);
    if (layoutCount.runs !== 24 || layoutCount.cacheHits !== 0 || coverageStats().runs !== 200) {
      throw new Error('Workload benchmark must measure target-cold keys');
    }
  }
  return { layoutMs: median(layout.slice(5)), coverageMs: median(coverage.slice(5)) };
}

function median(samples: number[]) {
  return samples.sort((a, b) => a - b)[5] as number;
}
