import type { ScheduleWindowSpec } from '../../src/components/schedule/schedule.types';
import type { Lane, Layer, LayerStyle } from '../../src/core';
import { windowFor } from '../../src/core';
import type { ExpandOptions, RosterRule, RuleSet } from '../../src/rrule';
import { expandRuleSet } from '../../src/rrule';

type ScheduleFixture = {
  title: string;
  windowSpec: ScheduleWindowSpec;
  set: RuleSet;
  layers: Layer[];
  options?: ExpandOptions;
  earlyStyle?: LayerStyle;
};

function rule(
  id: string,
  hourstart: number,
  hourend: number,
  timezone = 'UTC',
  dtstart = '2024-01-01',
): RosterRule {
  return { id, kind: 'include', frequency: 'DAILY', dtstart, hourstart, hourend, timezone };
}
const week: ScheduleWindowSpec = { span: 'week', anchorDate: '2024-01-01', timezone: 'UTC' };
const sessions: Layer = {
  id: 'sessions',
  role: 'booking',
  z: 1,
  style: { color: '#334e8a', inset: 4 },
  intervals: ['2024-01-01T10:30:00Z', '2024-01-03T13:00:00Z', '2024-01-05T15:00:00Z'].map(
    (start, index) => ({
      start: Date.parse(start),
      end: Date.parse(start) + 3_600_000,
      sources: [{ kind: 'session', id: String(index + 1) }],
    }),
  ),
};
const layered: ScheduleFixture = {
  title: 'Schedule: overlapping rules and three sessions',
  windowSpec: week,
  set: {
    rules: [rule('morning', 9, 13), rule('afternoon', 10, 17)],
    dates: [
      {
        id: 'session-1-gap',
        kind: 'exclude',
        date: '2024-01-01',
        timezone: 'UTC',
        hourstart: 10.5,
        hourend: 11.5,
      },
      {
        id: 'session-2-gap',
        kind: 'exclude',
        date: '2024-01-03',
        timezone: 'UTC',
        hourstart: 13,
        hourend: 14,
      },
      {
        id: 'session-3-gap',
        kind: 'exclude',
        date: '2024-01-05',
        timezone: 'UTC',
        hourstart: 15,
        hourend: 16,
      },
    ],
  },
  layers: [sessions],
};

function transitionFixture(title: string, anchorDate: string, timezone: string): ScheduleFixture {
  return {
    title,
    windowSpec: { span: 'week', anchorDate, timezone },
    set: {
      rules: [
        rule('early', 0, 4, timezone, anchorDate),
        rule('daytime', 9, 12, timezone, anchorDate),
      ],
      dates: [],
    },
    layers: [],
    earlyStyle: { color: '#b8a5df', inset: 4 },
  };
}

export const scheduleFixtures = {
  'schedule-empty': {
    title: 'Schedule: empty week',
    windowSpec: week,
    set: { rules: [], dates: [] },
    layers: [],
  },
  'schedule-layers': layered,
  'schedule-excluded': {
    title: 'Schedule: fully excluded day',
    windowSpec: week,
    set: {
      rules: [rule('whole-day', 0, 24)],
      dates: [
        {
          id: 'closed',
          kind: 'exclude',
          date: '2024-01-02',
          timezone: 'UTC',
          note: 'Full-day exclusion',
        },
      ],
    },
    layers: [],
  },
  'schedule-spring': transitionFixture('Schedule: Chicago spring', '2024-03-04', 'America/Chicago'),
  'schedule-fall': transitionFixture('Schedule: Chicago fall', '2024-10-28', 'America/Chicago'),
  'schedule-lord-howe': transitionFixture(
    'Schedule: Lord Howe 30-minute repeat',
    '2024-04-01',
    'Australia/Lord_Howe',
  ),
  'schedule-apia': transitionFixture('Schedule: Apia skipped date', '2011-12-26', 'Pacific/Apia'),
  'schedule-incomplete': {
    ...layered,
    title: 'Schedule: incomplete lane',
    options: { caps: { totalOccurrences: 0 } },
  },
  'schedule-midnight': {
    title: 'Schedule: midnight crossing',
    windowSpec: week,
    set: { rules: [], dates: [] },
    layers: [
      {
        id: 'crossing',
        role: 'custom',
        z: 1,
        style: { color: '#7c3aed' },
        intervals: [
          {
            start: Date.parse('2024-01-01T23:30Z'),
            end: Date.parse('2024-01-02T01:30Z'),
            sources: [{ kind: 'date', id: 'midnight' }],
          },
        ],
      },
    ],
  },
  'schedule-side-by-side': { ...layered, title: 'One lane: Roster and Schedule' },
} satisfies Record<string, ScheduleFixture>;

export type ScheduleFixtureId = keyof typeof scheduleFixtures;

export function scheduleLane(fixtureId: ScheduleFixtureId, windowSpec: ScheduleWindowSpec): Lane {
  const fixture: ScheduleFixture = scheduleFixtures[fixtureId];
  const expanded = expandRuleSet(fixture.set, windowFor(windowSpec), fixture.options);
  const layers: Layer[] = [...fixture.layers];
  let intervals = expanded.intervals;
  if (fixture.earlyStyle) {
    // Inset transition intervals leave an empty strip for pressing both occurrences.
    const early = intervals.filter((interval) =>
      interval.sources.some((source) => source.id === 'early'),
    );
    intervals = intervals.filter((interval) => !early.includes(interval));
    layers.push({ id: 'early', role: 'custom', z: 1, style: fixture.earlyStyle, intervals: early });
  }
  return {
    id: fixtureId,
    label: fixture.title,
    timezone: fixture.windowSpec.timezone,
    complete: expanded.complete,
    layers: [
      {
        id: 'open',
        role: 'availability',
        z: 0,
        style: { color: '#83c5a5', highlightColor: '#f59e0b' },
        intervals,
        gaps: expanded.gaps,
      },
      ...layers,
    ],
  };
}
