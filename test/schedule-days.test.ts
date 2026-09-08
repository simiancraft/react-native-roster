import { describe, expect, it } from 'bun:test';
import type {
  ScheduleProjection,
  ScheduleWindowSpec,
} from '../src/components/schedule/schedule.types';
import { headerDates, nowPosition, transitionBounds } from '../src/components/schedule/utils/days';
import type { DayColumn, Transition } from '../src/core';
import { dayColumnsFor, timeAtY, windowFor } from '../src/core';

function projection(anchorDate: string, timezone: string): ScheduleProjection {
  return {
    orientation: 'columns',
    viewTimezone: timezone,
    days: dayColumnsFor(windowFor({ span: 'week', anchorDate, timezone }), timezone),
    pxPerHour: 48,
    columnWidth: 40,
  };
}

describe('Schedule day chrome geometry', () => {
  it('round-trips now through both repeat sub-regions and ordinary days', () => {
    const p = projection('2024-10-28', 'America/Chicago');
    for (const time of [
      '2024-10-28T14:00Z',
      '2024-11-03T06:30Z',
      '2024-11-03T07:30Z',
      '2024-11-03T15:00Z',
    ]) {
      const absolute = Date.parse(time);
      const position = nowPosition(p, absolute) as { column: number; y: number };
      expect(timeAtY(p, position.column, position.y)).toBe(absolute);
    }
    expect(nowPosition(p, null)).toBeNull();
    expect(nowPosition(p, (p.days[6] as DayColumn).end)).toBeNull();
    expect(nowPosition(p, (p.days[0] as DayColumn).start - 1)).toBeNull();
  });
  it('clips skipped and repeated wall regions at day edges, for arbitrary offset sizes', () => {
    for (const [date, timezone, y, height] of [
      ['2024-03-04', 'America/Chicago', 96, 48],
      ['2024-10-28', 'America/Chicago', 48, 48],
      ['2024-04-01', 'Australia/Lord_Howe', 72, 24],
      ['2024-09-30', 'Australia/Lord_Howe', 96, 24],
    ] as const) {
      const p = projection(date, timezone);
      const day = p.days[6] as DayColumn;
      expect(transitionBounds(day, day.transitions[0] as Transition, p)).toEqual({
        y,
        height,
        width: 40,
      });
    }
    const apia = projection('2011-12-26', 'Pacific/Apia');
    const day = apia.days[4] as DayColumn;
    expect(transitionBounds(day, day.transitions[0] as Transition, apia).height).toBe(0);
  });
  it('finds skipped dates at any header position and respects day spans and wkst', () => {
    const spec: ScheduleWindowSpec = {
      span: 'week',
      anchorDate: '2011-12-30',
      timezone: 'Pacific/Apia',
    };
    for (const wkst of [0, 4, 5] as const) {
      const value = { ...spec, wkst };
      const days = dayColumnsFor(windowFor(value), value.timezone);
      const headers = headerDates(value, days);
      expect(headers).toHaveLength(7);
      expect(headers.filter(({ day }) => !day).map(({ localDate }) => localDate)).toEqual([
        '2011-12-30',
      ]);
    }
    expect(headerDates({ ...spec, span: 'day' }, [])).toEqual([
      { localDate: '2011-12-30', day: undefined },
    ]);
  });
});
