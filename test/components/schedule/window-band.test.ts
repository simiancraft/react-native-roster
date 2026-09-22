import { describe, expect, it } from 'bun:test';
import type { ScheduleProjection } from '../../../src/components/schedule/schedule.types';
import { projectWindowBand } from '../../../src/components/schedule/utils/window-band';
import type { Lane, Window } from '../../../src/core';
import { dayColumnsFor, layoutLane, windowFor } from '../../../src/core';

const minute = 60_000;
const hour = 60 * minute;

function projection(window: Window, timezone: string, pxPerHour = 60): ScheduleProjection {
  return {
    orientation: 'columns',
    viewTimezone: timezone,
    pxPerHour,
    columnWidth: 100,
    days: dayColumnsFor(window, timezone),
  };
}

function geometryFor(candidate: Window, window: Window, columns: ScheduleProjection) {
  const lane: Lane = {
    id: 'band',
    label: 'Band',
    layers: [
      {
        id: 'band',
        role: 'custom',
        z: 0,
        style: { color: 'transparent' },
        intervals: [{ ...candidate, sources: [] }],
      },
    ],
  };
  return layoutLane(lane, window, columns).rects.map(({ column, x, y, width, height }) => {
    if (column === undefined) throw new Error('Expected column geometry');
    return { column, x, y, width, height };
  });
}

function expectIntervalGeometry(candidate: Window, window: Window, columns: ScheduleProjection) {
  const pieces = projectWindowBand(candidate, window, columns);
  expect(
    pieces.map(({ column, x, y, width, height }) => ({ column, x, y, width, height })),
  ).toEqual(geometryFor(candidate, window, columns));
  for (const piece of pieces) {
    expect(piece.start).toBeGreaterThanOrEqual(Math.max(candidate.start, window.start));
    expect(piece.end).toBeLessThanOrEqual(Math.min(candidate.end, window.end));
    expect(piece.start).toBeGreaterThanOrEqual(piece.day.start);
    expect(piece.end).toBeLessThanOrEqual(piece.day.end);
    expect(piece.end).toBeGreaterThan(piece.start);
    expect(piece.height).toBeGreaterThan(0);
  }
  return pieces;
}

describe('window band projection', () => {
  it('projects an ordinary UTC band and clips a partial displayed day', () => {
    const day = windowFor({ span: 'day', anchorDate: '2024-01-01', timezone: 'UTC' });
    const fullProjection = projection(day, 'UTC', 48);
    const ordinary = { start: day.start + hour, end: day.start + 3 * hour };
    expect(expectIntervalGeometry(ordinary, day, fullProjection)).toMatchObject([
      { column: 0, start: ordinary.start, end: ordinary.end, x: 0, y: 48, width: 100, height: 96 },
    ]);

    const partial = { start: day.start + 6 * hour, end: day.start + 18 * hour };
    const partialProjection = projection(partial, 'UTC', 48);
    expect(expectIntervalGeometry(day, partial, partialProjection)).toMatchObject([
      {
        column: 0,
        start: partial.start,
        end: partial.end,
        x: 0,
        y: 288,
        width: 100,
        height: 576,
      },
    ]);
  });

  it('leaves a Chicago skip empty and splits both occurrences of a repeat', () => {
    const spring = windowFor({
      span: 'day',
      anchorDate: '2024-03-10',
      timezone: 'America/Chicago',
    });
    const springProjection = projection(spring, 'America/Chicago');
    const springAt = Date.parse('2024-03-10T08:00:00Z');
    const skipped = { start: springAt - 30 * minute, end: springAt + 30 * minute };
    expect(expectIntervalGeometry(skipped, spring, springProjection)).toMatchObject([
      { column: 0, y: 90, height: 30 },
      { column: 0, y: 180, height: 30 },
    ]);

    const fall = windowFor({
      span: 'day',
      anchorDate: '2024-11-03',
      timezone: 'America/Chicago',
    });
    const fallProjection = projection(fall, 'America/Chicago');
    const fallAt = Date.parse('2024-11-03T07:00:00Z');
    const repeated = { start: fallAt - 90 * minute, end: fallAt + 150 * minute };
    expect(
      expectIntervalGeometry(repeated, fall, fallProjection).map(({ y, height }) => [y, height]),
    ).toEqual([
      [30, 30],
      [60, 30],
      [90, 30],
      [120, 90],
    ]);
  });

  it('uses Lord Howe half-hour scale pieces', () => {
    const window = windowFor({
      span: 'day',
      anchorDate: '2024-04-07',
      timezone: 'Australia/Lord_Howe',
    });
    const columns = projection(window, 'Australia/Lord_Howe');
    const at = Date.parse('2024-04-06T15:00:00Z');
    expect(
      expectIntervalGeometry({ start: at - hour, end: at + hour }, window, columns).map(
        ({ y, height }) => [y, height],
      ),
    ).toEqual([
      [60, 30],
      [90, 15],
      [105, 15],
      [120, 30],
    ]);
  });

  for (const [timezone, anchorDate, transition, delta] of [
    ['America/St_Johns', '2009-11-01', '2009-11-01T02:31:00Z', 60],
    ['America/Goose_Bay', '1988-10-30', '1988-10-30T02:01:00Z', 120],
  ] as const) {
    it(`keeps ${timezone} cross-date rollback pieces inside the real column`, () => {
      const window = windowFor({ span: 'day', anchorDate, timezone });
      const columns = projection(window, timezone);
      const at = Date.parse(transition);
      const candidate = { start: at + 1000, end: at + 31000 };
      const pieces = expectIntervalGeometry(candidate, window, columns);
      expect(pieces).toHaveLength(1);
      expect(pieces[0]).toMatchObject({
        column: 0,
        start: candidate.start,
        end: candidate.end,
        x: 0,
        width: 100,
      });
      expect(pieces[0]?.y).toBeCloseTo(61 / 60 / (delta + 1), 10);
      expect(pieces[0]?.height).toBeCloseTo(0.5 / (delta + 1), 10);
    });
  }

  it("stops at Nuuk's end-boundary skip", () => {
    const window = windowFor({
      span: 'day',
      anchorDate: '2024-03-30',
      timezone: 'America/Nuuk',
    });
    const columns = projection(window, 'America/Nuuk');
    const pieces = expectIntervalGeometry(window, window, columns);
    expect(columns.days[0]).toMatchObject({
      start: Date.parse('2024-03-30T02:00:00Z'),
      end: Date.parse('2024-03-31T01:00:00Z'),
      transitions: [{ at: Date.parse('2024-03-31T01:00:00Z'), deltaMinutes: 60 }],
    });
    expect(pieces).toMatchObject([{ column: 0, y: 0, height: 1380 }]);
  });

  it('does not fabricate the wholly skipped Apia date', () => {
    const week = windowFor({
      span: 'week',
      anchorDate: '2011-12-30',
      timezone: 'Pacific/Apia',
    });
    const columns = projection(week, 'Pacific/Apia');
    const pieces = expectIntervalGeometry(week, week, columns);
    expect(columns.days.map((day) => day.localDate)).toEqual([
      '2011-12-26',
      '2011-12-27',
      '2011-12-28',
      '2011-12-29',
      '2011-12-31',
      '2012-01-01',
    ]);
    expect(pieces).toHaveLength(6);
    expect(pieces.map(({ day }) => day.localDate)).not.toContain('2011-12-30');

    const skipped = windowFor({
      span: 'day',
      anchorDate: '2011-12-30',
      timezone: 'Pacific/Apia',
    });
    expect(projectWindowBand(skipped, skipped, projection(skipped, 'Pacific/Apia'))).toEqual([]);
  });

  it('returns no pieces for empty, reversed, or outside candidates', () => {
    const window = windowFor({ span: 'day', anchorDate: '2024-01-01', timezone: 'UTC' });
    const columns = projection(window, 'UTC');
    for (const candidate of [
      { start: window.start, end: window.start },
      { start: window.end, end: window.start },
      { start: window.start - 2 * hour, end: window.start - hour },
      { start: window.end + hour, end: window.end + 2 * hour },
    ]) {
      expect(projectWindowBand(candidate, window, columns)).toEqual([]);
    }
  });
});
