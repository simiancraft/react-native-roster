import type { ReactNode } from 'react';
import type { ScheduleWindowSpec } from 'react-native-roster';
import type { Lane } from 'react-native-roster/core';
import type { Selection } from '../team-roster.types';
import { hoursLabel, zoneShort } from '../utils/format';
import { MemberInspectorLayout } from './layout';
import type { Member } from './member.types';
import { Fact, MemberIdentity } from './parts/identity';
import { EventSelection, NoSelection, SlotSelection, TimeOffSelection } from './parts/selection';
import { WeekSchedule } from './parts/week-schedule';

const SELECTION: {
  [K in Selection['kind']]: (
    selection: Extract<Selection, { kind: K }>,
    timezone: string,
  ) => ReactNode;
} = {
  event: (selection, timezone) => <EventSelection selection={selection} timezone={timezone} />,
  timeOff: (selection) => <TimeOffSelection selection={selection} />,
  slot: (selection, timezone) => <SlotSelection selection={selection} timezone={timezone} />,
  none: () => <NoSelection />,
};

function selectionZoneFor(selection: Selection, timezone: string): ReactNode {
  switch (selection.kind) {
    case 'event':
      return SELECTION.event(selection, timezone);
    case 'timeOff':
      return SELECTION.timeOff(selection, timezone);
    case 'slot':
      return SELECTION.slot(selection, timezone);
    case 'none':
      return SELECTION.none(selection, timezone);
  }
}

/** The selected member's card, selection detail, and week; a composer nested in the roster. */
export function MemberInspector({
  lane,
  member,
  selection,
  windowSpec,
}: {
  lane: Lane;
  member: Member;
  selection: Selection;
  windowSpec: ScheduleWindowSpec;
}) {
  return (
    <MemberInspectorLayout
      identityZone={<MemberIdentity member={member} />}
      factsZone={
        <>
          <Fact label="Hours" value={hoursLabel(member.hours)} />
          <Fact label="Zone" value={zoneShort(member.timezone)} />
          <Fact label="Days" value={`${member.workdays.length}/wk`} />
        </>
      }
      selectionZone={selectionZoneFor(selection, windowSpec.timezone)}
      scheduleZone={<WeekSchedule lane={lane} windowSpec={windowSpec} />}
    />
  );
}
