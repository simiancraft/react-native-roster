import { expect, it } from 'bun:test';
import {
  clearExpandCache,
  expandRuleSet,
  expandStats,
  resetExpandStats,
} from '../../src/adapters/rrule';
import { clearLayoutCache, layoutLane, next, windowFor } from '../../src/core';
import { performanceLanes } from '../fixtures/performance-lanes';
import { rosterWindowSpec } from '../fixtures/roster';
import { workload } from '../fixtures/workload';

it('feeds W through real expansion, retains density, edits one rule, and reuses both envelopes', () => {
  clearExpandCache();
  clearLayoutCache();
  const window = windowFor(rosterWindowSpec);
  const lanes = performanceLanes(window, '2024-01-01', expandRuleSet, 24, 'UTC');
  const original = workload().lanes;
  const projection = {
    orientation: 'horizontal' as const,
    viewTimezone: 'UTC',
    pxPerMinute: 0.5,
    rowHeight: 48,
  };
  for (const [index, lane] of lanes.entries()) {
    expect(lane.layers).toEqual(original[index]?.layers ?? []);
    const geometry = layoutLane(lane, window, projection);
    expect(geometry.rects.length + geometry.gapRects.length).toBe(70);
  }
  resetExpandStats();
  const edited = performanceLanes(window, '2024-01-01', expandRuleSet, 10, 'Pacific/Auckland');
  expect(expandStats().expanded).toBe(1);
  expect(edited[199]?.timezone).toBe('Pacific/Auckland');
  expect(edited[0]?.layers).not.toEqual(lanes[0]?.layers);
  resetExpandStats();
  performanceLanes(windowFor(next(rosterWindowSpec)), '2024-01-08', expandRuleSet, 10, 'UTC');
  expect(expandStats().expanded).toBe(2);
  resetExpandStats();
  performanceLanes(window, '2024-01-01', expandRuleSet, 10, 'UTC');
  expect(expandStats().expanded).toBe(0);
});
