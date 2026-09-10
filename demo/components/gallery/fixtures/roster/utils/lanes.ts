import type { Lane, WindowSpec } from 'react-native-roster/core';
import { windowFor } from 'react-native-roster/core';
import type { ExpandResult, expandRuleSet } from 'react-native-roster/rrule';
import { performanceLanes } from '../../../../../../test/fixtures/performance-lanes';
import type { RosterFixture } from '../../../../../../test/fixtures/roster';
import { expandLanes } from '../../../../../../test/fixtures/timezones';

type LaneSourceInput = {
  fixtureId: string;
  definition: RosterFixture;
  windowSpec: WindowSpec;
  /** Present when the fixture has an applied rule set; it becomes the one lane. */
  expansion: ExpandResult | undefined;
  expand: typeof expandRuleSet;
  /** Workload edits: the rule hour end and the last lane's zone. */
  ruleHourEnd: number;
  laneTimezone: string;
};

/** The lanes for one window; the first trait the fixture record declares wins. */
export function fixtureLanes(input: LaneSourceInput): Lane[] {
  const { definition, windowSpec, expand } = input;
  const window = windowFor(windowSpec);
  if (input.expansion) return [ruleSetLane(input.fixtureId, definition.title, input.expansion)];
  if (definition.workload && windowSpec.span !== 'custom')
    return performanceLanes(
      window,
      windowSpec.anchorDate,
      expand,
      input.ruleHourEnd,
      input.laneTimezone,
    );
  if (definition.lanesFor) return definition.lanesFor(window, expand);
  if (definition.ruleLanes) return expandLanes(definition.ruleLanes, window, expand);
  return definition.lanes;
}

function ruleSetLane(id: string, label: string, expansion: ExpandResult): Lane {
  return {
    id,
    label,
    complete: expansion.complete,
    layers: [
      {
        id: 'open',
        role: 'availability',
        z: 0,
        style: { color: '#4f9478' },
        intervals: expansion.intervals,
        gaps: expansion.gaps,
      },
    ],
  };
}
