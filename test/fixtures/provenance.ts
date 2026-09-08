import type { Lane, Layer, Window } from '../../src/core';
import type { expandRuleSet, RuleSet } from '../../src/rrule';
import type { RosterFixture } from './roster';

const start = Date.UTC(2024, 0, 1);
const hour = 3_600_000;
const style = { color: '#4f9478', highlightColor: '#f59e0b' };
const sharedRule: RuleSet = {
  rules: [
    {
      id: 'shared-rule',
      kind: 'include',
      frequency: 'DAILY',
      dtstart: '2024-01-01',
      hourstart: 9,
      hourend: 17,
      timezone: 'UTC',
    },
  ],
  dates: [],
};
const gap: Layer = {
  id: 'open',
  role: 'availability',
  z: 9,
  style,
  intervals: [],
  gaps: [{ start, end: start + 24 * hour, sources: [{ kind: 'date', id: 'closed' }] }],
};
const occupied: Layer = {
  id: 'occupied',
  role: 'booking',
  z: 1,
  style: { color: '#334e8a', inset: 8 },
  intervals: [
    {
      start: start + 10 * hour,
      end: start + 12 * hour,
      sources: [{ kind: 'session', id: 'inside-gap' }],
    },
  ],
};

export const provenanceFixtures = {
  'booking-in-gap': {
    title: 'Booking inside an availability gap',
    zones: {},
    showsEmptyExample: false,
    lanes: [{ id: 'booking-in-gap', label: 'Press 10:00 to 12:00', layers: [gap, occupied] }],
  },
  'equal-z': {
    title: 'Equal z: later layer wins',
    zones: {},
    showsEmptyExample: false,
    lanes: [
      {
        id: 'equal-z',
        label: 'Press the overlap',
        layers: [
          {
            ...occupied,
            id: 'earlier',
            style,
            intervals: [
              {
                start: start + 9 * hour,
                end: start + 13 * hour,
                sources: [{ kind: 'rule', id: 'earlier' }],
              },
            ],
          },
          {
            ...occupied,
            id: 'later',
            intervals: [
              {
                start: start + 10 * hour,
                end: start + 12 * hour,
                sources: [{ kind: 'rule', id: 'later' }],
              },
            ],
          },
        ],
      },
    ],
  },
  'highlight-rule': {
    title: 'One rule across 20 lanes',
    zones: {},
    showsEmptyExample: false,
    lanes: [],
    highlightSource: { kind: 'rule', id: 'shared-rule' },
    lanesFor: highlightLanes,
  },
  'sort-coverage': {
    title: 'Sort coverage across 200 lanes',
    zones: {},
    showsEmptyExample: false,
    lanes: Array.from(
      { length: 200 },
      (_, index): Lane => ({
        id: `sort-${index}`,
        label: `Lane ${String(index).padStart(3, '0')}`,
        layers: [
          {
            id: 'open',
            role: 'availability',
            z: 0,
            style,
            intervals: [
              {
                start: start + 9 * hour,
                end: start + (10 + index / 100) * hour,
                sources: [{ kind: 'rule', id: `sort-${index}` }],
              },
            ],
          },
          {
            ...occupied,
            intervals: [
              {
                start: start + 9 * hour,
                end: start + (9 + index / 70) * hour,
                sources: [{ kind: 'session', id: `sort-${index}` }],
              },
            ],
          },
        ],
      }),
    ),
  },
  'incomplete-expansion': {
    title: 'Incomplete expansion',
    zones: {},
    showsEmptyExample: false,
    lanes: [],
    lanesFor: incompleteLanes,
  },
} satisfies Record<string, RosterFixture>;

function highlightLanes(window: Window, expand: typeof expandRuleSet): Lane[] {
  const result = expand(sharedRule, window);
  return Array.from({ length: 20 }, (_, index) => ({
    id: `highlight-${index}`,
    label: `Lane ${String(index).padStart(2, '0')}`,
    complete: result.complete,
    layers: [
      {
        id: 'open',
        role: 'availability',
        z: 0,
        style,
        intervals: result.intervals,
        gaps: result.gaps,
      },
    ],
  }));
}

function incompleteLanes(window: Window, expand: typeof expandRuleSet): Lane[] {
  const result = expand(sharedRule, window, { caps: { perRuleOccurrences: 1 } });
  return [
    {
      id: 'capped',
      label: 'Expansion capped at one occurrence',
      complete: result.complete,
      layers: [
        {
          id: 'open',
          role: 'availability',
          z: 0,
          style,
          intervals: result.intervals,
          gaps: result.gaps,
        },
      ],
    },
  ];
}
