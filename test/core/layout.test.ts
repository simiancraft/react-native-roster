import { beforeEach, describe, expect, it } from 'bun:test';
import type { DayColumn, Interval, Lane, Layer, Projection, Source } from '../../src/core';
import {
  clearCoverageCache,
  clearLayoutCache,
  coverageFor,
  coverageStats,
  dayColumnsFor,
  flagFor,
  layoutLane,
  layoutStats,
  resetStats,
  timeAtX,
} from '../../src/core';
import { structuralKey } from '../../src/core/hash';

const minute = 60_000;
const origin = Date.UTC(2024, 0, 1);
const window = { start: origin, end: origin + 1440 * minute };
const horizontal: Extract<Projection, { orientation: 'horizontal' }> = {
  orientation: 'horizontal',
  viewTimezone: 'UTC',
  pxPerMinute: 1,
  rowHeight: 40,
};
const columns: Extract<Projection, { orientation: 'columns' }> = {
  orientation: 'columns',
  viewTimezone: 'UTC',
  pxPerHour: 60,
  columnWidth: 100,
  days: dayColumnsFor(window, 'UTC'),
};
const a: Source = { kind: 'rule', id: 'a', label: 'A' };
const b: Source = { kind: 'rule', id: 'b' };
function interval(start: number, end: number, sources = [a]): Interval {
  return { start: origin + start * minute, end: origin + end * minute, sources };
}
function lane(intervals: Interval[] = []): Lane {
  return {
    id: 'one',
    label: 'One',
    layers: [{ id: 'open', role: 'availability', z: 0, style: { color: 'green' }, intervals }],
  };
}

beforeEach(() => {
  clearLayoutCache();
  clearCoverageCache();
  resetStats();
});

describe('exact geometry and provenance', () => {
  for (const projection of [horizontal, columns]) {
    it(`splits A/B overlap in ${projection.orientation}`, () => {
      const geometry = layoutLane(
        lane([interval(540, 660), interval(600, 720, [b])]),
        window,
        projection,
      );
      expect(
        geometry.rects.map((rect) => [
          rect.sources.map((source) => source.id),
          projection.orientation === 'horizontal' ? rect.x : rect.y,
          projection.orientation === 'horizontal' ? rect.width : rect.height,
        ]),
      ).toEqual([
        [['a'], 540, 60],
        [['a', 'b'], 600, 60],
        [['b'], 660, 60],
      ]);
    });
  }

  it('clips both edges, whole-window spans, empty spans, and sub-minute bounds', () => {
    const narrow = { start: origin, end: origin + 10 * minute };
    expect(
      layoutLane(lane([interval(-2, 2), interval(8, 12)]), narrow, horizontal).rects.map(
        ({ x, width }) => [x, width],
      ),
    ).toEqual([
      [0, 2],
      [8, 2],
    ]);
    expect(layoutLane(lane([interval(-2, 12)]), narrow, horizontal).rects[0]?.width).toBe(10);
    const tiny = lane([
      { start: origin + 123, end: origin + 456, sources: [a] },
      interval(2, 2),
      interval(20, 21),
      interval(-5, -1),
    ]);
    const rects = layoutLane(tiny, narrow, horizontal).rects;
    expect(rects).toHaveLength(1);
    expect(rects[0]?.x).toBe(123 / minute);
    expect(rects[0]?.width).toBe(333 / minute);
    expect(coverageFor(tiny, narrow).availabilityMinutes).toBe(333 / minute);
    expect(layoutLane(tiny, { start: origin, end: origin }, horizontal).rects).toEqual([]);
  });

  it('merges by full source identity regardless of labels, order, duplicates, or nesting', () => {
    const geometry = layoutLane(
      lane([
        interval(0, 1, [a, b]),
        interval(1, 2, [
          { ...b, label: 'different' },
          { kind: 'rule', id: 'a' },
        ]),
        interval(0.5, 1.5, [a, a]),
        interval(3, 4, []),
        interval(4, 5, []),
        interval(5, 6, [{ kind: 'date', id: 'a' }]),
        interval(6, 7, [{ kind: 'rule|x', id: 'y' }]),
        interval(7, 8, [{ kind: 'rule', id: 'x|y' }]),
      ]),
      window,
      horizontal,
    );
    expect(geometry.rects.map(({ x, width, sources }) => [x, width, sources.length])).toEqual([
      [0, 2, 2],
      [3, 2, 0],
      [5, 1, 1],
      [6, 1, 1],
      [7, 1, 1],
    ]);
    const fresh = { kind: 'rule', id: 'a' };
    expect(
      geometry.rects[0]?.sources.some(
        (source) => source.kind === fresh.kind && source.id === fresh.id,
      ),
    ).toBe(true);
  });

  it('keeps the 60-minute worked example exact with a gap and inset', () => {
    const input = lane([interval(540, 705)]);
    (input.layers[0] as Layer).gaps = [interval(705, 720, [{ kind: 'date', id: 'excluded' }])];
    input.layers.push({
      id: 'occupied',
      role: 'booking',
      z: 2,
      style: { color: 'blue', inset: 4 },
      intervals: [interval(630, 690, [{ kind: 'session', id: 'one' }])],
    });
    for (const projection of [horizontal, columns]) {
      const geometry = layoutLane(input, window, projection);
      expect(geometry.coverage).toEqual({
        availabilityMinutes: 165,
        bookingMinutes: 60,
        availabilityMinusBookingMinutes: 105,
      });
      if (projection.orientation === 'columns') {
        expect(geometry.rects.map(({ x, y, width, height }) => [x, y, width, height])).toEqual([
          [0, 540, 100, 165],
          [4, 630, 92, 60],
        ]);
        expect(geometry.gapRects[0]).toMatchObject({ y: 705, height: 15, z: 0 });
      } else {
        expect(geometry.rects.map(({ x, y, width, height }) => [x, y, width, height])).toEqual([
          [540, 0, 165, 40],
          [630, 4, 60, 32],
        ]);
        expect(geometry.gapRects[0]).toMatchObject({ x: 705, width: 15, z: 0 });
      }
    }
  });

  it('splits intervals and gaps at midnight and clips to the projection days', () => {
    const twoDays = { start: origin, end: origin + 2880 * minute };
    const projection = { ...columns, days: dayColumnsFor(twoDays, 'UTC') };
    const input = lane([interval(1410, 1470)]);
    (input.layers[0] as Layer).gaps = [interval(1410, 1470)];
    const geometry = layoutLane(input, twoDays, projection);
    expect(
      geometry.rects.map(({ column, y, height, sources, x }) => [column, y, height, sources, x]),
    ).toEqual([
      [0, 1410, 30, [a], 0],
      [1, 0, 30, [a], 0],
    ]);
    expect(geometry.gapRects).toEqual(geometry.rects);
    expect(layoutLane(input, twoDays, columns).rects).toHaveLength(1);
    expect(layoutLane(lane([interval(-60, 3000)]), twoDays, projection).rects).toHaveLength(2);
  });

  it('preserves a fully subtracted layer and exact overlapping gap provenance', () => {
    const input = lane();
    (input.layers[0] as Layer).gaps = [interval(540, 660), interval(600, 720, [b])];
    for (const projection of [horizontal, columns]) {
      const geometry = layoutLane(input, window, projection);
      expect(geometry.rects).toEqual([]);
      expect(geometry.gapRects.map(({ sources }) => sources.map(({ id }) => id))).toEqual([
        ['a'],
        ['a', 'b'],
        ['b'],
      ]);
      expect(geometry.coverage.availabilityMinutes).toBe(0);
      expect(geometry.flag).toBe('none');
    }
  });

  it('handles columns before, between, and after spans and clamps oversized inset', () => {
    const threeDays = { start: origin, end: origin + 4320 * minute };
    const input = lane([interval(10, 20), interval(2900, 2910)]);
    (input.layers[0] as Layer).style.inset = 100;
    const geometry = layoutLane(input, threeDays, {
      ...columns,
      days: dayColumnsFor(threeDays, 'UTC'),
    });
    expect(geometry.rects.map(({ column, width }) => [column, width])).toEqual([
      [0, 0],
      [2, 0],
    ]);
    expect(layoutLane(input, threeDays, horizontal).rects[0]?.height).toBe(0);
    expect(layoutLane(input, threeDays, { ...columns, days: [] }).rects).toEqual([]);
  });
});

describe('coverage and flags', () => {
  it('unions roles, intersects bookings, ignores gaps and custom layers', () => {
    const input = lane([interval(-1, 20), interval(5, 10), interval(20, 30)]);
    (input.layers[0] as Layer).gaps = [interval(0, 30)];
    input.layers.push({
      ...(input.layers[0] as Layer),
      id: 'second',
      intervals: [interval(25, 40)],
    });
    input.layers.push({
      ...(input.layers[0] as Layer),
      id: 'occupied',
      role: 'booking',
      intervals: [interval(5, 15), interval(10, 20), interval(35, 50), interval(60, 70)],
    });
    input.layers.push({
      ...(input.layers[0] as Layer),
      id: 'custom',
      role: 'custom',
      intervals: [interval(0, 1000)],
    });
    expect(coverageFor(input, window)).toEqual({
      availabilityMinutes: 40,
      bookingMinutes: 40,
      availabilityMinusBookingMinutes: 20,
    });
    expect(coverageFor(lane(), window)).toEqual({
      availabilityMinutes: 0,
      bookingMinutes: 0,
      availabilityMinusBookingMinutes: 0,
    });
  });

  it('never infers never-set and honors all explicit flags', () => {
    expect(flagFor(lane(), window)).toBe('none');
    expect(flagFor({ id: 'empty', label: 'Empty', layers: [] }, window)).toBe('none');
    const outside = lane([interval(-10, 0), interval(1440, 1500)]);
    expect(flagFor(outside, window)).toBe('empty-in-window');
    expect(flagFor(lane([interval(0, 1)]), window)).toBe('none');
    for (const flag of ['none', 'never-set', 'empty-in-window'] as const)
      expect(flagFor({ ...outside, flag }, window)).toBe(flag);
  });
});

describe('cache boundaries and counters', () => {
  it('reuses complete inputs and ignores lane display metadata, even mutable metadata', () => {
    const input = lane([interval(10, 20)]);
    const first = layoutLane(input, window, horizontal);
    expect(layoutLane(structuredClone(input), { ...window }, { ...horizontal })).toBe(first);
    expect(
      layoutLane(
        {
          ...input,
          timezone: 'Pacific/Auckland',
          label: 'Changed',
          complete: false,
          meta: { circular: input },
        },
        window,
        horizontal,
      ),
    ).toBe(first);
    expect(layoutStats()).toEqual({ runs: 1, cacheHits: 2 });
    expect(coverageStats()).toEqual({ runs: 1, cacheHits: 2 });
    expect(layoutLane(input, window, { ...horizontal, rowHeight: 50 })).not.toBe(first);
    expect(layoutLane(input, window, { ...horizontal, viewTimezone: 'Asia/Tokyo' })).not.toBe(
      first,
    );
    expect(layoutLane(input, window, { ...horizontal, pxPerMinute: 2 })).not.toBe(first);
    expect(layoutLane(input, { ...window, end: window.end + 1 }, horizontal)).not.toBe(first);
    expect(layoutLane({ ...input, id: 'two' }, window, horizontal)).not.toBe(first);
    (input.layers[0] as Layer).style.inset = 4;
    expect(layoutLane(input, window, horizontal).rects[0]?.y).toBe(4);
    ((input.layers[0] as Layer).intervals[0] as Interval).end += minute;
    expect(coverageFor(input, window).availabilityMinutes).toBe(11);
  });

  it('version bypasses hashing and preserves type and presence distinctions', () => {
    const input = { ...lane([interval(10, 20)]), version: 1 };
    const first = layoutLane(input, window, horizontal);
    ((input.layers[0] as Layer).intervals[0] as Interval).end += minute;
    expect(layoutLane(input, window, horizontal)).toBe(first);
    expect(layoutLane({ ...input, version: 2 }, window, horizontal)).not.toBe(first);
    expect(layoutLane({ ...input, version: '1' }, window, horizontal)).not.toBe(first);
    expect(layoutLane({ ...input, version: undefined }, window, horizontal)).not.toBe(first);
    expect(layoutLane({ ...input, version: 0 }, window, horizontal)).not.toBe(first);
  });

  it('assembles flags and fresh coverage without recomputing rects', () => {
    const input = lane([interval(10, 20)]);
    const first = layoutLane(input, window, horizontal);
    input.flag = 'never-set';
    const second = layoutLane(input, window, horizontal);
    expect(second).not.toBe(first);
    expect(second.rects).toBe(first.rects);
    expect(second.gapRects).toBe(first.gapRects);
    expect(second.flag).toBe('never-set');
    expect(first.flag).toBe('none');
    expect(layoutLane(input, window, horizontal)).toBe(second);
    clearCoverageCache();
    const third = layoutLane(input, window, horizontal);
    expect(third.coverage).not.toBe(second.coverage);
    expect(third.rects).toBe(second.rects);
    expect(layoutStats()).toEqual({ runs: 1, cacheHits: 3 });
    expect(coverageStats()).toEqual({ runs: 2, cacheHits: 2 });
    clearLayoutCache();
    expect(layoutStats()).toEqual({ runs: 1, cacheHits: 3 });
    expect(layoutLane(input, window, horizontal).rects).not.toBe(first.rects);
    resetStats();
    expect(layoutStats()).toEqual({ runs: 0, cacheHits: 0 });
    expect(coverageStats()).toEqual({ runs: 0, cacheHits: 0 });
    layoutLane(input, window, horizontal);
    expect(layoutStats()).toEqual({ runs: 0, cacheHits: 1 });
  });

  it('retains earlier flag assemblies and separates styles shared by layer id', () => {
    const input = lane([interval(10, 20)]);
    const first = layoutLane(input, window, horizontal);
    const changed = layoutLane({ ...input, flag: 'never-set' }, window, horizontal);
    expect(changed.rects).toBe(first.rects);
    expect(layoutLane(input, window, horizontal)).toBe(first);
    const other = {
      ...input,
      id: 'other',
      layers: input.layers.map((layer) => ({
        ...layer,
        style: { color: 'blue', inset: 5 },
      })),
    };
    expect(layoutLane(other, window, horizontal).rects[0]?.y).toBe(5);
    expect(first.rects[0]?.y).toBe(0);
  });

  it('includes every projection and day field with structural property ordering', () => {
    const input = lane([interval(10, 20)]);
    const first = layoutLane(input, window, columns);
    const day = columns.days[0] as DayColumn;
    for (const changed of [
      { ...columns, columnWidth: 120 },
      { ...columns, pxPerHour: 120 },
      { ...columns, viewTimezone: 'Etc/UTC' },
      { ...columns, days: [] },
      ...[
        { ...day, label: 'Other' },
        { ...day, start: day.start + 1 },
        { ...day, end: day.end - 1 },
        { ...day, localDate: '2024-01-02' },
        { ...day, transitions: [{ at: day.start + 60 * minute, deltaMinutes: 0 }] },
      ].map((changedDay) => ({ ...columns, days: [changedDay] })),
    ])
      expect(layoutLane(input, window, changed)).not.toBe(first);
    expect(
      layoutLane(input, window, {
        days: columns.days,
        columnWidth: 100,
        pxPerHour: 60,
        viewTimezone: 'UTC',
        orientation: 'columns',
      }),
    ).toBe(first);
    expect(structuralKey({ b: null, a: 1, c: undefined })).toBe(structuralKey({ a: 1, b: null }));
  });

  it('inverts elapsed horizontal length independently of the view zone', () => {
    expect(timeAtX(horizontal, window, 90)).toBe(origin + 90 * minute);
    expect(timeAtX({ ...horizontal, pxPerMinute: 2 }, window, 180)).toBe(origin + 90 * minute);
    expect(timeAtX(horizontal, { start: origin + minute, end: window.end }, 90)).toBe(
      origin + 91 * minute,
    );
  });
});
