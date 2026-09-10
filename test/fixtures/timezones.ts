import type { expandRuleSet, RuleSet } from '../../src/adapters/rrule';
import type { Lane, Window, WindowSpec } from '../../src/core';

export type RuleLane = Pick<Lane, 'id' | 'label' | 'timezone'> & { set: RuleSet };

export function ruleLane(id: string, timezone: string, hourstart = 9, hourend = 10): RuleLane {
  return {
    id,
    label: `${id}: ${hourstart}:00 to ${hourend}:00 local`,
    timezone,
    set: {
      rules: [
        {
          id: `${id}-daily`,
          kind: 'include',
          frequency: 'DAILY',
          dtstart: '2024-01-01',
          hourstart,
          hourend,
          timezone,
        },
      ],
      dates: [],
    },
  };
}

export function expandLanes(
  inputs: RuleLane[],
  window: Window,
  expand: typeof expandRuleSet,
): Lane[] {
  return inputs.map(({ set, ...lane }) => {
    const result = expand(set, window);
    return {
      ...lane,
      complete: result.complete,
      layers: [
        {
          id: 'local-hours',
          role: 'availability',
          z: 0,
          style: { color: '#4f9478' },
          intervals: result.intervals,
          gaps: result.gaps,
        },
      ],
    };
  });
}

export const springWeek: WindowSpec = {
  span: 'week',
  anchorDate: '2024-03-04',
  timezone: 'America/Chicago',
};
export const fallWeek: WindowSpec = {
  span: 'week',
  anchorDate: '2024-10-28',
  timezone: 'America/Chicago',
};
export const mixedZoneLanes = [
  ruleLane('Chicago', 'America/Chicago'),
  ruleLane('London', 'Europe/London'),
  ruleLane('Auckland', 'Pacific/Auckland'),
];
const dstLanes = [
  ruleLane('Morning', 'America/Chicago'),
  ruleLane('Across the change', 'America/Chicago', 0, 4),
  ruleLane('Whole day', 'America/Chicago', 0, 24),
];
const windowPresets = [
  { label: 'March DST week', windowSpec: springWeek },
  { label: 'November DST week', windowSpec: fallWeek },
];

export const timezoneFixtures = {
  'dst-week': {
    title: 'DST week',
    description:
      'Chicago local hours across the change. March has 167 elapsed hours; November has 169. Scroll right to Sunday to see the skipped or repeated hour.',
    lanes: [],
    ruleLanes: dstLanes,
    windowSpec: springWeek,
    windowPresets,
    pxPerMinute: 1,
    zones: {},
    showsEmptyExample: false,
  },
  'mixed-timezones': {
    title: 'Mixed timezones',
    description:
      'Three lanes, each with a 09:00 rule in its own zone. In Chicago, London starts at 03:00 before March 10 and 04:00 afterward, until London changes on March 31. Change the view zone or navigate to compare.',
    lanes: [],
    ruleLanes: mixedZoneLanes,
    windowSpec: springWeek,
    windowPresets,
    pxPerMinute: 1,
    zones: {},
    showsEmptyExample: false,
  },
};
