import { afterEach, describe, expect, it, setSystemTime, spyOn } from 'bun:test';
import type {
  DayColumn,
  Interval,
  Lane,
  Layer,
  Projection,
  Rect,
  WindowSpec,
} from '../../src/core';
import {
  clearCoverageCache,
  clearLayoutCache,
  coverageStats,
  dayColumnsFor,
  layoutLane,
  layoutStats,
  next,
  prev,
  resetStats,
  snapToStep,
  timeAtY,
  today,
  windowFor,
} from '../../src/core';
import { scalePieces } from '../../src/core/scale';
import {
  dateEpoch,
  localDateAt,
  offsetAt,
  startOfDate,
  transitionsBetween,
  wallTime,
} from '../../src/core/zone';

const hour = 3_600_000;
const minute = 60_000;
const source = { kind: 'rule', id: 'one' };
const horizontal: Extract<Projection, { orientation: 'horizontal' }> = {
  orientation: 'horizontal',
  viewTimezone: 'UTC',
  pxPerMinute: 1,
  rowHeight: 40,
};
function projection(anchorDate: string, timezone: string, span: 'week' | 'day' = 'week') {
  const window = windowFor({ anchorDate, timezone, span });
  const columns: Extract<Projection, { orientation: 'columns' }> = {
    orientation: 'columns',
    viewTimezone: timezone,
    pxPerHour: 60,
    columnWidth: 100,
    days: dayColumnsFor(window, timezone),
  };
  return { window, columns };
}
function lane(start: number, end: number): Lane {
  const interval = { start, end, sources: [source] };
  return {
    id: 'transitions',
    label: 'Transitions',
    layers: [
      {
        id: 'open',
        role: 'availability',
        z: 0,
        style: { color: 'green' },
        intervals: [interval],
        gaps: [interval],
      },
    ],
  };
}

afterEach(() => {
  setSystemTime();
});

describe('view-zone windows and navigation', () => {
  it('keeps the anchor visible for day, week, and month, with Monday as default', () => {
    for (const span of ['day', 'week', 'month'] as const) {
      const window = windowFor({ span, anchorDate: '2024-03-10', timezone: 'America/Chicago' });
      const instant = Date.parse('2024-03-10T12:00:00-05:00');
      expect(instant >= window.start && instant < window.end).toBe(true);
    }
    expect(
      windowFor({ span: 'week', anchorDate: '2024-03-10', timezone: 'America/Chicago' }),
    ).toEqual({
      start: Date.parse('2024-03-04T00:00:00-06:00'),
      end: Date.parse('2024-03-11T00:00:00-05:00'),
    });
    expect(windowFor({ span: 'week', anchorDate: '2024-03-10', timezone: 'UTC', wkst: 6 })).toEqual(
      { start: Date.parse('2024-03-10T00:00:00Z'), end: Date.parse('2024-03-17T00:00:00Z') },
    );
    expect(windowFor({ span: 'month', anchorDate: '2024-02-29', timezone: 'UTC' })).toEqual({
      start: Date.parse('2024-02-01T00:00:00Z'),
      end: Date.parse('2024-03-01T00:00:00Z'),
    });
  });

  it('moves day, week, month, and custom spans without mutating the input', () => {
    for (const span of ['day', 'week', 'month'] as const) {
      const spec = { span, anchorDate: '2024-12-15', timezone: 'UTC', wkst: 2 } as const;
      expect(prev(next(spec))).toEqual(spec);
      expect(next(prev(spec))).toEqual(spec);
    }
    expect(next({ span: 'day', anchorDate: '2024-02-28', timezone: 'UTC' })).toMatchObject({
      anchorDate: '2024-02-29',
    });
    expect(next({ span: 'month', anchorDate: '2024-01-31', timezone: 'UTC' })).toMatchObject({
      anchorDate: '2024-02-29',
    });
    expect(prev({ span: 'month', anchorDate: '2023-03-31', timezone: 'UTC' })).toMatchObject({
      anchorDate: '2023-02-28',
    });
    const custom: WindowSpec = {
      span: 'custom',
      window: { start: 100, end: 300 },
      timezone: 'UTC',
    };
    expect(windowFor(custom)).toBe(custom.window);
    expect(next(custom)).toEqual({ ...custom, window: { start: 300, end: 500 } });
    expect(prev(custom)).toEqual({ ...custom, window: { start: -100, end: 100 } });
    expect(prev(next(custom))).toEqual(custom);
  });

  it('today reads the date in the view zone and preserves custom duration', () => {
    setSystemTime(new Date('2024-01-01T02:00:00Z'));
    expect(
      today({ span: 'week', anchorDate: '2000-01-01', timezone: 'America/Chicago' }),
    ).toMatchObject({ anchorDate: '2023-12-31' });
    expect(
      today({ span: 'custom', window: { start: 0, end: hour }, timezone: 'Asia/Tokyo' }),
    ).toMatchObject({
      window: {
        start: Date.parse('2024-01-01T00:00:00+09:00'),
        end: Date.parse('2024-01-01T01:00:00+09:00'),
      },
    });
  });

  it('changes zones with the same seven local dates and target-cold layout and coverage', () => {
    clearLayoutCache();
    clearCoverageCache();
    resetStats();
    const chicago = projection('2024-03-06', 'America/Chicago');
    const auckland = projection('2024-03-06', 'Pacific/Auckland');
    expect(chicago.columns.days.map((day) => day.localDate)).toEqual(
      auckland.columns.days.map((day) => day.localDate),
    );
    const input = lane(chicago.window.start - 48 * hour, chicago.window.end + 48 * hour);
    layoutLane(input, chicago.window, chicago.columns);
    layoutLane(input, auckland.window, auckland.columns);
    expect(layoutStats()).toEqual({ runs: 2, cacheHits: 0 });
    expect(coverageStats()).toEqual({ runs: 2, cacheHits: 0 });
  });

  it('next then prev and changing pointer steps reuse target geometry', () => {
    clearLayoutCache();
    clearCoverageCache();
    resetStats();
    const spec: WindowSpec = {
      span: 'week',
      anchorDate: '2024-03-06',
      timezone: 'America/Chicago',
    };
    const window = windowFor(spec);
    const input = lane(window.start, window.end);
    const first = layoutLane(input, window, horizontal);
    layoutLane(input, windowFor(next(spec)), horizontal);
    resetStats();
    expect(layoutLane(input, windowFor(prev(next(spec))), horizontal)).toBe(first);
    expect(layoutStats()).toEqual({ runs: 0, cacheHits: 1 });
    for (const step of [15, 30, 60]) {
      expect(snapToStep(window.start + 59 * minute, step, spec.timezone)).toBe(
        window.start + Math.floor(59 / step) * step * minute,
      );
      expect(layoutLane(input, window, horizontal)).toBe(first);
    }
    expect(layoutStats()).toEqual({ runs: 0, cacheHits: 4 });
  });

  it('keeps complete day columns for partial windows and no columns for empty windows', () => {
    const start = Date.parse('2024-01-01T12:00:00Z');
    const days = dayColumnsFor({ start, end: start + hour }, 'UTC');
    expect(days).toHaveLength(1);
    expect(days[0]).toMatchObject({
      start: start - 12 * hour,
      end: start + 12 * hour,
      localDate: '2024-01-01',
      label: 'Mon',
      transitions: [],
    });
    expect(dayColumnsFor({ start, end: start }, 'UTC')).toEqual([]);
    expect(dayColumnsFor({ start, end: start - 1 }, 'UTC')).toEqual([]);
  });
});

describe('transition geometry and pointer inversion', () => {
  it('reuses day bounds and transitions across pointer calls in the same local day', () => {
    const at = Date.parse('2025-11-02T07:00:00Z');
    const timezone = 'America/Chicago';
    const formatToParts = spyOn(Intl.DateTimeFormat.prototype, 'formatToParts');
    try {
      expect(snapToStep(at - 30 * minute, 60, timezone)).toBe(at - hour);
      expect(formatToParts.mock.calls.length).toBeGreaterThan(3);
      formatToParts.mockClear();

      const second = at + 45 * minute;
      expect(snapToStep(second, 60, timezone)).toBe(at);
      // Only the pointer instant is formatted for its floor and local date;
      // no day-boundary or transition instants are probed again.
      expect(formatToParts.mock.calls.map(([time]) => time)).toEqual([second, second]);

      formatToParts.mockClear();
      snapToStep(second, 60, 'UTC');
      expect(formatToParts.mock.calls.length).toBeGreaterThan(3);
      formatToParts.mockClear();
      snapToStep(second + 24 * hour, 60, timezone);
      expect(formatToParts.mock.calls.length).toBeGreaterThan(3);
    } finally {
      formatToParts.mockRestore();
    }
  });

  it('leaves the Chicago spring gap empty with epoch-exact split boundaries', () => {
    const { window, columns } = projection('2024-03-10', 'America/Chicago');
    expect((window.end - window.start) / hour).toBe(167);
    const day = columns.days[6] as DayColumn;
    const at = Date.parse('2024-03-10T08:00:00Z');
    expect(day.transitions).toEqual([{ at, deltaMinutes: 60 }]);
    const input = lane(
      Date.parse('2024-03-10T01:30:00-06:00'),
      Date.parse('2024-03-10T03:30:00-05:00'),
    );
    const geometry = layoutLane(input, window, columns);
    expect(geometry.rects.map(({ column, y, height }) => [column, y, height])).toEqual([
      [6, 90, 30],
      [6, 180, 30],
    ]);
    expect(geometry.gapRects).toEqual(geometry.rects);
    expect(geometry.coverage.availabilityMinutes).toBe(60);
    expect(timeAtY(columns, 6, 119)).toBe(at - minute);
    expect(timeAtY(columns, 6, 120)).toBeNull();
    expect(timeAtY(columns, 6, 150)).toBeNull();
    expect(timeAtY(columns, 6, 180)).toBe(at);
    expect(timeAtY(columns, 6, 210)).toBe(
      ((input.layers[0] as Layer).intervals[0] as Interval).end,
    );
    expect(timeAtY(columns, -1, 0)).toBeNull();
    expect(timeAtY(columns, 0, -1)).toBeNull();
    expect(timeAtY(columns, 0, 1440)).toBeNull();
    expect(timeAtY(columns, 0, Number.NaN)).toBeNull();
    const tiny = layoutLane(lane(at - 123, at + 456), window, columns);
    expect(tiny.rects[0]?.height).toBe(123 / minute);
    expect(tiny.rects[1]?.height).toBe(456 / minute);
  });

  it('splits all three Chicago fall scale boundaries and both repeated occurrences', () => {
    const { window, columns } = projection('2024-11-03', 'America/Chicago');
    expect((window.end - window.start) / hour).toBe(169);
    const at = Date.parse('2024-11-03T07:00:00Z');
    expect(columns.days[6]?.transitions).toEqual([{ at, deltaMinutes: -60 }]);
    const geometry = layoutLane(lane(at - 90 * minute, at + 150 * minute), window, columns);
    expect(geometry.rects.map(({ y, height }) => [y, height])).toEqual([
      [30, 30],
      [60, 30],
      [90, 30],
      [120, 90],
    ]);
    expect(geometry.gapRects).toEqual(geometry.rects);
    expect(timeAtY(columns, 6, 75)).toBe(at - 30 * minute);
    expect(timeAtY(columns, 6, 105)).toBe(at + 30 * minute);
    expect(timeAtY(columns, 6, 90)).toBe(at);
    expect(timeAtY(columns, 6, 120)).toBe(at + hour);
    expect(snapToStep(at + 45 * minute + 123, 60, columns.viewTimezone)).toBe(at);
    expect(snapToStep(at - 15 * minute, 60, columns.viewTimezone)).toBe(at - hour);
    expect(snapToStep(at + 75 * minute, 60, columns.viewTimezone)).toBe(at + hour);
  });

  for (const [timezone, anchorDate, transition, delta] of [
    ['America/St_Johns', '2009-11-01', '2009-11-01T02:31:00Z', 60],
    ['America/Goose_Bay', '1988-10-30', '1988-10-30T02:01:00Z', 120],
  ] as const) {
    it(`keeps cross-date rollback rects and pointers inside ${timezone} columns`, () => {
      const { window, columns } = projection(anchorDate, timezone);
      const at = Date.parse(transition);
      const start = at + 1000;
      const end = at + 31000;
      const day = columns.days[6] as DayColumn;
      expect(day.localDate).toBe(anchorDate);
      expect(localDateAt(start, timezone)).not.toBe(anchorDate);
      const geometry = layoutLane(lane(start, end), window, columns);
      expect(geometry.rects).toHaveLength(1);
      const rect = geometry.rects[0] as Rect;
      expect(rect.column).toBe(6);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.y + rect.height).toBeLessThanOrEqual(1440);
      expect(rect.y).toBeCloseTo(61 / 60 / (delta + 1), 10);
      expect(rect.height).toBeCloseTo(0.5 / (delta + 1), 10);
      expect(timeAtY(columns, 6, rect.y)).toBeCloseTo(start, 2);
      expect(timeAtY(columns, 6, rect.y + rect.height / 2)).toBeCloseTo(start + 15000, 2);
      expect(geometry.gapRects).toEqual(geometry.rects);
      const full = layoutLane(lane(window.start, window.end), window, columns);
      for (const rect of full.rects) {
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeLessThan(1440);
        expect(rect.y + rect.height).toBeLessThanOrEqual(1440);
      }
      expect(timeAtY(columns, 6, 0)).toBe(day.start);
      expect(timeAtY(columns, 6, 1 / (delta + 1))).toBe(at);
      expect(timeAtY(columns, 6, 1)).toBe(at + delta * minute);
      expect(localDateAt(timeAtY(columns, 6, 540) as number, timezone)).toBe(anchorDate);
      const narrow = dayColumnsFor({ start, end }, timezone);
      expect(narrow).toEqual([day]);
      expect(dayColumnsFor({ start: day.start, end }, timezone)).toEqual([day]);
      expect(
        dayColumnsFor({ start: day.start - 1, end }, timezone).map((day) => day.localDate),
      ).toEqual([localDateAt(day.start - 1, timezone), anchorDate]);
    });
  }

  it('bounds inverse rounding below each scale piece and day end', () => {
    for (const [date, timezone] of [
      ['2024-01-01', 'UTC'],
      ['2024-11-03', 'America/Chicago'],
      ['2009-11-01', 'America/St_Johns'],
      ['1988-10-30', 'America/Goose_Bay'],
    ] as const) {
      const { columns } = projection(date, timezone, 'day');
      columns.pxPerHour = 48;
      const day = columns.days[0];
      if (!day) throw new Error('Expected a day column');
      for (const piece of scalePieces(day, timezone)) {
        const endY =
          ((piece.minute + ((piece.end - piece.start) / minute) * piece.scale) * 48) / 60;
        const time = timeAtY(columns, 0, endY - 1e-9);
        expect(time).not.toBeNull();
        expect(time).toBeGreaterThanOrEqual(piece.start);
        expect(time).toBeLessThan(piece.end);
        expect(time).toBeLessThan(day.end);
      }
    }
  });

  it('keeps 09:00 aligned over all seven days in spring and fall', () => {
    for (const anchor of ['2024-03-10', '2024-11-03']) {
      const { window, columns } = projection(anchor, 'America/Chicago');
      for (let index = 0; index < columns.days.length; index++) {
        const time = timeAtY(columns, index, 540) as number;
        const geometry = layoutLane(lane(time, time + hour), window, columns);
        expect(geometry.rects[0]).toMatchObject({ column: index, y: 540, height: 60 });
        expect(new Date(wallTime(time, columns.viewTimezone)).getUTCHours()).toBe(9);
      }
      const full = layoutLane(lane(window.start, window.end), window, {
        ...horizontal,
        viewTimezone: columns.viewTimezone,
      });
      expect(full.rects[0]?.width).toBe((window.end - window.start) / minute);
    }
  });

  it('handles Lord Howe half-hour repeats and clamps a 60-minute floor', () => {
    const { window, columns } = projection('2024-04-07', 'Australia/Lord_Howe', 'day');
    const at = Date.parse('2024-04-06T15:00:00Z');
    expect(columns.days[0]?.transitions).toEqual([{ at, deltaMinutes: -30 }]);
    const geometry = layoutLane(lane(at - hour, at + hour), window, columns);
    expect(geometry.rects.map(({ y, height }) => [y, height])).toEqual([
      [60, 30],
      [90, 15],
      [105, 15],
      [120, 30],
    ]);
    expect(timeAtY(columns, 0, 97.5)).toBe(at - 15 * minute);
    expect(timeAtY(columns, 0, 112.5)).toBe(at + 15 * minute);
    expect(snapToStep(at + 15 * minute, 60, columns.viewTimezone)).toBe(at);
    expect(snapToStep(at + 15 * minute, 30, columns.viewTimezone)).toBe(at);
    expect(snapToStep(at - 15 * minute, 60, columns.viewTimezone)).toBe(at - hour);
    const spring = projection('2024-10-06', 'Australia/Lord_Howe', 'day');
    const forward = Date.parse('2024-10-05T15:30:00Z');
    expect(spring.columns.days[0]?.transitions).toEqual([{ at: forward, deltaMinutes: 30 }]);
    expect(timeAtY(spring.columns, 0, 120)).toBeNull();
    expect(timeAtY(spring.columns, 0, 149)).toBeNull();
    expect(timeAtY(spring.columns, 0, 150)).toBe(forward);
    expect(snapToStep(forward + 15 * minute, 60, spring.columns.viewTimezone)).toBe(forward);
  });

  it('omits the wholly skipped Apia date and lays out six columns', () => {
    const { window, columns } = projection('2011-12-30', 'Pacific/Apia');
    expect(columns.days.map((day) => day.localDate)).toEqual([
      '2011-12-26',
      '2011-12-27',
      '2011-12-28',
      '2011-12-29',
      '2011-12-31',
      '2012-01-01',
    ]);
    expect((window.end - window.start) / hour).toBe(144);
    expect(layoutLane(lane(window.start, window.end), window, columns).rects).toHaveLength(6);
    const skipped = windowFor({ span: 'day', anchorDate: '2011-12-30', timezone: 'Pacific/Apia' });
    expect(skipped.start).toBe(skipped.end);
    expect(dayColumnsFor(skipped, 'Pacific/Apia')).toEqual([]);
    expect(columns.days[4]?.transitions).toEqual([
      { at: Date.parse('2011-12-30T10:00:00Z'), deltaMinutes: 1440 },
    ]);
    expect(timeAtY(columns, 4, 0)).toBe(Date.parse('2011-12-30T10:00:00Z'));
  });

  it('handles a midnight skip, transition endpoints, fractional offsets, and multiple scale changes', () => {
    const midnight = projection('2018-11-04', 'America/Sao_Paulo', 'day');
    expect(timeAtY(midnight.columns, 0, 30)).toBeNull();
    expect(timeAtY(midnight.columns, 0, 60)).toBe(midnight.window.start);
    expect(midnight.columns.days[0]?.transitions[0]?.deltaMinutes).toBe(60);
    const at = Date.parse('2024-03-10T08:00:00Z');
    expect(transitionsBetween(at - hour, at, 'America/Chicago')).toEqual([]);
    expect(transitionsBetween(at - hour, at + 1, 'America/Chicago')).toEqual([
      { at, deltaMinutes: 60 },
    ]);
    expect(offsetAt(Date.parse('2024-01-01T00:00:00Z'), 'Asia/Kathmandu')).toBe(345 * minute);
    expect(wallTime(-123, 'UTC')).toBe(-123);
    expect(startOfDate('0001-01-01', 'UTC')).toBe(dateEpoch('0001-01-01'));
    const base = Date.parse('2024-01-01T00:00:00Z');
    const pieces = scalePieces(
      {
        start: base,
        end: base + 24 * hour,
        localDate: '2024-01-01',
        label: 'Mon',
        transitions: [
          { at: base + hour, deltaMinutes: -120 },
          { at: base + 23 * hour, deltaMinutes: -120 },
          { at: base + 12 * hour, deltaMinutes: 30 },
        ],
      },
      'UTC',
    );
    expect(
      pieces.map(({ start, end, scale }) => [(start - base) / hour, (end - base) / hour, scale]),
    ).toEqual([
      [0, 1, 0.5],
      [1, 3, 0.5],
      [3, 12, 1],
      [12, 21, 1],
      [21, 23, 0.5],
      [23, 24, 0.5],
    ]);
  });

  it('validates dates and pointer steps and preserves exact sub-minute floors', () => {
    for (const value of ['nope', '2024-02-30', '2024-2-01'])
      expect(() => dateEpoch(value)).toThrow(RangeError);
    for (const step of [0, -1, 7, 1.5, Infinity, Number.NaN])
      expect(() => snapToStep(0, step, 'UTC')).toThrow(RangeError);
    expect(snapToStep(61_234, 1, 'UTC')).toBe(60_000);
    expect(localDateAt(Date.parse('2024-01-01T23:00:00Z'), 'Asia/Tokyo')).toBe('2024-01-02');
    expect(() =>
      windowFor({ span: 'day', anchorDate: '2024-01-01', timezone: 'Invalid/Zone' }),
    ).toThrow(RangeError);
  });
});
