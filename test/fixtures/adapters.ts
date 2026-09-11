import type { RuleSet } from '../../src/adapters/rrule';
import type { RosterFixture } from './roster';

const weekly: RuleSet = {
  rules: [
    {
      id: 'weekday-hours',
      kind: 'include',
      frequency: 'WEEKLY',
      dtstart: '2024-01-01',
      byweekday: [0, 1, 2, 3, 4],
      hourstart: 9,
      hourend: 17,
      timezone: 'America/Chicago',
    },
  ],
  dates: [],
};
const overrides: RuleSet = {
  rules: weekly.rules,
  dates: [
    {
      id: 'closed',
      kind: 'exclude',
      date: '2024-01-02',
      timezone: 'America/Chicago',
      note: 'Closed all day',
    },
    {
      id: 'short-break',
      kind: 'exclude',
      date: '2024-01-03',
      timezone: 'America/Chicago',
      hourstart: 12,
      hourend: 13,
    },
    {
      id: 'extra-day',
      kind: 'include',
      date: '2024-01-06',
      timezone: 'America/Chicago',
      hourstart: 10,
      hourend: 14,
    },
  ],
};
const base = {
  lanes: [],
  zones: {},
  showsEmptyExample: false,
  windowSpec: { span: 'week', anchorDate: '2024-01-01', timezone: 'America/Chicago' },
} as const;

export const adapterFixtures = {
  'adapter-weekly': {
    ...base,
    lanes: [],
    title: 'Adapter: weekly local hours',
    ruleSet: weekly,
    description:
      'Edit the JSON, then Apply rule set. Weekdays use Monday = 0. Press a block to read its rule source.',
  },
  'adapter-overrides': {
    ...base,
    lanes: [],
    title: 'Adapter: includes and exclusions',
    ruleSet: overrides,
    description:
      'Tuesday is fully excluded; Wednesday has a partial gap; Saturday is a dated include. Press each span to inspect provenance.',
  },
  'adapter-caps': {
    ...base,
    lanes: [],
    title: 'Adapter: incomplete result',
    ruleSet: overrides,
    expandOptions: { caps: { totalOccurrences: 0 } },
    description:
      'The total occurrence cap is 0. The adapter reports incomplete; the lane carries that notice. Truncation details appear beside the rule set.',
  },
} satisfies Record<string, RosterFixture>;
