import { describe, expect, it, spyOn } from 'bun:test';
import { pressPoint } from '../src/components/roster/press-point.web';
import { bodyContentKey } from '../src/components/roster/utils/body-content-key';
import { hitTest } from '../src/components/roster/utils/hit-test';
import { stylesFor } from '../src/components/roster/utils/styles';
import { ticksFor } from '../src/components/roster/utils/ticks';
import type { Coverage, Lane, Layer, WindowSpec } from '../src/core';
import {
  byCoverage,
  byLabel,
  dayColumnsFor,
  layoutLane,
  timeAtX,
  timeAtY,
  windowFor,
} from '../src/core';
import { scalePieces } from '../src/core/scale';
import { wallTime } from '../src/core/zone';
import { type RosterFixtureId, rosterFixtures, rosterWindowSpec } from './fixtures/roster';

const projection = {
  orientation: 'horizontal' as const,
  viewTimezone: 'UTC',
  pxPerMinute: 1,
  rowHeight: 48,
};

describe('roster pure helpers', () => {
  it('maps DOM clicks relative to the pressed row and centers keyboard presses', () => {
    const currentTarget = {
      getBoundingClientRect: () => ({ left: 200, top: 80, width: 500, height: 48 }),
    };
    expect(pressPoint({ currentTarget, nativeEvent: { clientX: 340, clientY: 92 } })).toEqual({
      x: 140,
      y: 12,
    });
    expect(pressPoint({ currentTarget, nativeEvent: {} })).toEqual({ x: 250, y: 24 });
  });
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
  it('shares styles only for equal layer ids and canonical style contents', () => {
    const fixtureId: RosterFixtureId = 'single-lane';
    const layer = rosterFixtures[fixtureId].lanes[0]?.layers[0] as Layer;
    const same = { ...layer, style: { highlightColor: '#f59e0b', color: '#4f9478' } };
    expect(stylesFor(layer)).toBe(stylesFor(same));
    expect(stylesFor({ ...layer, id: 'different' })).not.toBe(stylesFor(layer));
    const changed = stylesFor({ ...layer, style: { color: '#fff', opacity: 0.4 } });
    expect(changed.normal.opacity).toBe(0.4);
    expect(changed.highlighted.backgroundColor).toBe('#fff');
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
  it('keys body content by geometry, source identity, and zone fillers', () => {
    const input = {
      window: windowFor(rosterWindowSpec),
      projection,
      intervalZone: () => null,
      gapZone: () => null,
      highlightSource: { kind: 'rule', id: 'one' },
    };
    const key = bodyContentKey(input);
    expect(
      bodyContentKey({
        ...input,
        window: { ...input.window },
        projection: { ...projection },
        highlightSource: { ...input.highlightSource, label: 'Display metadata' },
      }),
    ).toBe(key);
    for (const changed of [
      { window: { ...input.window, start: input.window.start + 1 } },
      { window: { ...input.window, end: input.window.end + 1 } },
      { projection: { ...projection, viewTimezone: 'America/Chicago' } },
      { projection: { ...projection, pxPerMinute: 2 } },
      { projection: { ...projection, rowHeight: 64 } },
      { highlightSource: { kind: 'date', id: 'one' } },
      { highlightSource: { kind: 'rule', id: 'two' } },
      { intervalZone: () => null },
      { gapZone: () => null },
      { onIntervalHover: () => {} },
      { incompleteLabel: 'Partial data' },
    ])
      expect(bodyContentKey({ ...input, ...changed })).not.toBe(key);
  });
  it('reuses tick content without any formatToParts calls on an identical second call', () => {
    const spec: WindowSpec = {
      span: 'week',
      anchorDate: '2025-03-03',
      timezone: 'America/Chicago',
    };
    const window = windowFor(spec);
    dayColumnsFor(window, spec.timezone);
    const parts = spyOn(Intl.DateTimeFormat.prototype, 'formatToParts');
    try {
      const ticks = ticksFor(window, spec, { ...projection, pxPerMinute: 3 }, 15);
      // Cached day columns need only the local date at the window start.
      expect(parts).toHaveBeenCalledTimes(1);
      parts.mockClear();
      expect(ticksFor({ ...window }, { ...spec }, { ...projection, pxPerMinute: 3 }, 15)).toBe(
        ticks,
      );
      expect(parts).toHaveBeenCalledTimes(0);
      expect(ticksFor(window, spec, { ...projection, pxPerMinute: 4 }, 15)).not.toBe(ticks);
      expect(ticksFor(window, spec, { ...projection, pxPerMinute: 3 }, 30)).not.toBe(ticks);
    } finally {
      parts.mockRestore();
    }
  });
  it('places Chicago spring and fall week ticks on wall steps with both repeat occurrences', () => {
    for (const anchorDate of ['2024-03-04', '2024-10-28']) {
      const spec: WindowSpec = { span: 'week', anchorDate, timezone: 'America/Chicago' };
      const window = windowFor(spec);
      const horizontal = { ...projection, viewTimezone: spec.timezone, pxPerMinute: 3 };
      const days = dayColumnsFor(window, spec.timezone);
      const columns = {
        orientation: 'columns' as const,
        viewTimezone: spec.timezone,
        pxPerHour: 60,
        columnWidth: 100,
        days,
      };
      const ticks = ticksFor(window, spec, horizontal, 15);
      const expected: number[] = [];
      // Independent wall-clock oracle checks every instant that could be a tick.
      for (let time = window.start; time < window.end; time += 60_000) {
        if (wallTime(time, spec.timezone) % (15 * 60_000) === 0) expected.push(time);
      }
      expect(ticks.map((tick) => tick.time)).toEqual(expected);
      expect(ticks).toHaveLength(anchorDate === '2024-03-04' ? 668 : 676);
      for (const [index, day] of days.entries()) {
        const pieces = scalePieces(day, spec.timezone);
        for (const tick of ticks.filter((tick) => tick.time >= day.start && tick.time < day.end)) {
          expect(timeAtX(horizontal, window, tick.x)).toBe(tick.time);
          const piece = pieces.find((piece) => tick.time >= piece.start && tick.time < piece.end);
          if (!piece) throw new Error('Missing scale piece');
          const y = piece.minute + ((tick.time - piece.start) / 60_000) * piece.scale;
          expect(timeAtY(columns, index, y)).toBe(tick.time);
        }
      }
      const sunday = ticks.filter((tick) => tick.time >= (days[6]?.start ?? 0));
      expect(sunday.filter((tick) => tick.label === '01:30')).toHaveLength(
        anchorDate === '2024-03-04' ? 1 : 2,
      );
      expect(sunday.filter((tick) => tick.label === '02:30')).toHaveLength(
        anchorDate === '2024-03-04' ? 0 : 1,
      );
      const clipped: WindowSpec = {
        span: 'custom',
        timezone: spec.timezone,
        window: { start: (days[6]?.start ?? 0) + 97.5 * 60_000, end: window.end - 17.5 * 60_000 },
      };
      expect(ticksFor(clipped.window, clipped, horizontal, 15).map((tick) => tick.time)).toEqual([
        clipped.window.start,
        ...expected.filter((time) => time > clipped.window.start && time < clipped.window.end),
      ]);
    }
  });
  it('emits day boundaries, resolution ticks, month dates, and exact custom-window ticks', () => {
    for (const span of ['day', 'week', 'month'] as const) {
      const spec: WindowSpec = { ...rosterWindowSpec, span, anchorDate: '2024-01-01' };
      const ticks = ticksFor(windowFor(spec), spec, projection, 60);
      expect(ticks.filter((tick) => tick.kind === 'day')).toHaveLength(
        { day: 1, week: 7, month: 31 }[span],
      );
    }
    const spec: WindowSpec = { span: 'day', anchorDate: '2024-01-01', timezone: 'UTC' };
    expect(ticksFor(windowFor(spec), spec, projection, 15)).toHaveLength(96);
    expect(
      ticksFor(
        windowFor(rosterWindowSpec),
        rosterWindowSpec,
        { ...projection, pxPerMinute: 0.1 },
        15,
      ),
    ).toHaveLength(7);
    const start = Date.UTC(2024, 0, 1, 0, 7, 30);
    const custom: WindowSpec = {
      span: 'custom',
      timezone: 'UTC',
      window: { start, end: start + 20 * 60_000 },
    };
    const ticks = ticksFor(custom.window, custom, projection, 15);
    expect(ticks.map((tick) => tick.time)).toEqual([start, Date.UTC(2024, 0, 1, 0, 15)]);
    for (const step of [0, 7, 1.5])
      expect(() => ticksFor(custom.window, custom, projection, step)).toThrow('divisor');
  });
});
