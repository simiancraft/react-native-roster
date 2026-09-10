import { describe, expect, it } from 'bun:test';
import type { Coverage, Lane, Layer, Projection } from '../../src/core';
import { byCoverage, byLabel, layoutLane, windowFor } from '../../src/core';
import { hitTest } from '../../src/core/hit-test';
import { rosterFixtures, rosterWindowSpec } from '../fixtures/roster';

const projection: Projection = {
  orientation: 'horizontal',
  viewTimezone: 'UTC',
  pxPerMinute: 1,
  rowHeight: 48,
};

describe('lane order and hit testing', () => {
  it('sorts coverage descending, breaks ties by label, and accepts missing entries', () => {
    const a: Lane = { id: 'a', label: 'A', layers: [] };
    const b: Lane = { id: 'b', label: 'B', layers: [] };
    const coverage = new Map<string, Coverage>([
      ['a', { availabilityMinutes: 20, bookingMinutes: 15, availabilityMinusBookingMinutes: 5 }],
      ['b', { availabilityMinutes: 10, bookingMinutes: 0, availabilityMinusBookingMinutes: 10 }],
    ]);
    expect(byLabel(a, b)).toBeLessThan(0);
    expect(byCoverage({ measure: 'availability' })(a, b, coverage)).toBe(-10);
    expect(byCoverage({ measure: 'availabilityMinusBooking' })(a, b, coverage)).toBe(5);
    expect(byCoverage({ measure: 'availability' })(a, b, new Map())).toBeLessThan(0);
  });
  it('tests final bounds and ignores lower-z and earlier equal-z candidates', () => {
    const original = rosterFixtures['two-layers'].lanes[0] as Lane;
    const upper = original.layers[1] as Layer;
    const lane: Lane = { ...original, layers: [...original.layers, { ...upper, id: 'last' }] };
    const geometry = layoutLane(lane, windowFor(rosterWindowSpec), projection);
    geometry.rects = [...geometry.rects].reverse();
    expect(hitTest(lane, geometry, 720, 10)?.rect.layerId).toBe('last');
    expect(hitTest(lane, geometry, 720, 40)?.rect.layerId).toBe('open');
    expect(hitTest(lane, geometry, 720, 48)).toBeUndefined();
    expect(hitTest(lane, geometry, 2000, 0)).toBeUndefined();
  });
});
