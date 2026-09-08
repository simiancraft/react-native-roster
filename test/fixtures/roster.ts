import type { RosterProps } from '../../src';
import type { Lane, WindowSpec } from '../../src/core';
import { replacedZones } from './roster-zones';
import { workload } from './workload';

const start = Date.UTC(2024, 0, 1);
const hour = 3_600_000;
const single: Lane = {
  id: 'one',
  label: 'Lane one',
  timezone: 'America/Chicago',
  layers: [
    {
      id: 'open',
      role: 'availability',
      z: 0,
      style: { color: '#4f9478', highlightColor: '#f59e0b' },
      intervals: [
        {
          start: start + 9 * hour,
          end: start + 17 * hour,
          sources: [{ kind: 'rule', id: 'one', label: '09:00 to 17:00' }],
        },
      ],
    },
  ],
};
const inset: Lane = {
  ...single,
  id: 'inset',
  label: 'Two layers',
  layers: [
    ...single.layers,
    {
      id: 'occupied',
      role: 'booking',
      z: 1,
      style: { color: '#334e8a', inset: 8 },
      intervals: [
        {
          start: start + 11 * hour,
          end: start + 13 * hour,
          sources: [{ kind: 'session', id: 'one' }],
        },
      ],
    },
  ],
};
const excluded: Lane = {
  id: 'excluded',
  label: 'Fully excluded day',
  layers: [
    {
      id: 'open',
      role: 'availability',
      z: 0,
      style: { color: '#4f9478' },
      intervals: [],
      gaps: [
        {
          start,
          end: start + 24 * hour,
          sources: [{ kind: 'date', id: 'closed', label: 'Full-day exclusion' }],
        },
      ],
    },
  ],
};

type RosterFixture = {
  title: string;
  lanes: Lane[];
  zones: Pick<RosterProps, keyof typeof replacedZones>;
  showsEmptyExample: boolean;
};

export const rosterFixtures: Record<
  | 'empty'
  | 'single-lane'
  | 'two-layers'
  | 'full-day-gap'
  | 'never-set'
  | 'every-zone'
  | '200-lanes',
  RosterFixture
> = {
  empty: { title: 'Empty roster', lanes: [], zones: {}, showsEmptyExample: false },
  'single-lane': { title: 'Single lane', lanes: [single], zones: {}, showsEmptyExample: false },
  'two-layers': {
    title: 'Two layers with inset',
    lanes: [inset],
    zones: {},
    showsEmptyExample: false,
  },
  'full-day-gap': {
    title: 'Full-day exclusion',
    lanes: [excluded],
    zones: {},
    showsEmptyExample: false,
  },
  'never-set': {
    zones: {},
    showsEmptyExample: false,
    title: 'Lane flags and completeness',
    lanes: [
      { id: 'never', label: 'Never set', flag: 'never-set', layers: [] },
      {
        ...single,
        id: 'outside',
        label: 'Empty in this window',
        layers: single.layers.map((layer) => ({
          ...layer,
          intervals: layer.intervals.map((interval) => ({
            ...interval,
            start: interval.start - 31 * 24 * hour,
            end: interval.end - 31 * 24 * hour,
          })),
        })),
      },
      { id: 'incomplete', label: 'Incomplete lane', complete: false, layers: [] },
    ] as Lane[],
  },
  'every-zone': {
    title: 'Every zone replaced',
    lanes: [inset, excluded],
    zones: replacedZones,
    showsEmptyExample: true,
  },
  '200-lanes': { title: '200 lanes', lanes: workload().lanes, zones: {}, showsEmptyExample: false },
};
export type RosterFixtureId = keyof typeof rosterFixtures;
export const rosterWindowSpec: WindowSpec = {
  span: 'week',
  anchorDate: '2024-01-01',
  timezone: 'UTC',
};
