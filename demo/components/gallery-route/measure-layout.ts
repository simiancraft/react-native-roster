import type { Lane, Window } from 'react-native-roster/core';
import {
  byLabel,
  clearCoverageCache,
  clearLayoutCache,
  layoutLane,
  layoutStats,
  resetStats,
} from 'react-native-roster/core';
import { clearExpandCache } from 'react-native-roster/rrule';

/** Measures W's 24 label-sorted lanes; fixture preparation and cache clearing are untimed. */
export function measureLayout(lanes: Lane[], window: Window, viewTimezone: string): string {
  const visible = [...lanes].sort(byLabel).slice(0, 24);
  const projection = {
    orientation: 'horizontal' as const,
    viewTimezone,
    rowHeight: 48,
    pxPerMinute: 0.5,
  };
  clearExpandCache();
  clearLayoutCache();
  clearCoverageCache();
  resetStats();
  const start = performance.now();
  for (const lane of visible) layoutLane(lane, window, projection);
  const elapsed = performance.now() - start;
  const { runs, cacheHits } = layoutStats();
  return `Target-cold layout: ${elapsed.toFixed(3)} ms; ${runs} runs, ${cacheHits} hits; ${new Date(window.start).toISOString()}`;
}
