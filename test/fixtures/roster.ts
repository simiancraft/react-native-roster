import type { RosterProps } from '../../src';
import type { Lane, Source, Window, WindowSpec } from '../../src/core';
import type { ExpandOptions, expandRuleSet, RuleSet } from '../../src/rrule';
import { adapterFixtures } from './adapters';
import { provenanceFixtures } from './provenance';
import { replacedZones } from './roster-zones';
import { type RuleLane, timezoneFixtures } from './timezones';
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

export type RosterFixture = {
  ruleSet?: RuleSet;
  expandOptions?: ExpandOptions;
  minuteStep?: number;
  lanesFor?: (window: Window, expand: typeof expandRuleSet) => Lane[];
  highlightSource?: Source;
  title: string;
  description?: string;
  windowSpec?: WindowSpec;
  windowPresets?: { label: string; windowSpec: WindowSpec }[];
  ruleLanes?: RuleLane[];
  pxPerMinute?: number;
  lanes: Lane[];
  zones: Pick<RosterProps, keyof typeof replacedZones>;
  showsEmptyExample: boolean;
};

export const rosterFixtures: Record<
  | 'empty'
  | 'single-lane'
  | '20-lanes'
  | 'default-zones'
  | `${'day' | 'week' | 'month'}-${15 | 30 | 60}`
  | keyof typeof adapterFixtures
  | 'two-layers'
  | 'full-day-gap'
  | 'never-set'
  | 'every-zone'
  | '200-lanes'
  | keyof typeof provenanceFixtures
  | keyof typeof timezoneFixtures,
  RosterFixture
> = {
  ...provenanceFixtures,
  ...adapterFixtures,
  ...axisFixtures(),
  ...timezoneFixtures,
  empty: { title: 'Empty roster', lanes: [], zones: {}, showsEmptyExample: false },
  '20-lanes': { title: '20 lanes', lanes: workload(20).lanes, zones: {}, showsEmptyExample: false },
  'default-zones': {
    title: 'Every roster zone: defaults',
    lanes: [inset, excluded],
    zones: {},
    showsEmptyExample: true,
  },
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
  '200-lanes': {
    highlightSource: { kind: 'rule', id: '0:a' },
    title: '200 lanes',
    lanes: workload().lanes,
    zones: {},
    showsEmptyExample: false,
  },
};
export type RosterFixtureId = keyof typeof rosterFixtures;
export const rosterWindowSpec: WindowSpec = {
  span: 'week',
  anchorDate: '2024-01-01',
  timezone: 'UTC',
};

function axisFixtures() {
  const fixtures = {} as Record<`${'day' | 'week' | 'month'}-${15 | 30 | 60}`, RosterFixture>;
  for (const span of ['day', 'week', 'month'] as const) {
    for (const minuteStep of [15, 30, 60] as const) {
      fixtures[`${span}-${minuteStep}`] = {
        title: `Axis: ${span}, ${minuteStep} minutes`,
        description:
          'Step changes ticks and pointer snapping; interval bounds stay exact. Navigate, then return to inspect cache reuse.',
        lanes: [inset],
        zones: {},
        showsEmptyExample: false,
        minuteStep,
        windowSpec: { span, anchorDate: '2024-01-01', timezone: 'UTC' },
      };
    }
  }
  return fixtures;
}
