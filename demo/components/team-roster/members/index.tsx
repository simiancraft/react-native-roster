import type { ReactNode } from 'react';
import type { Lane } from 'react-native-roster/core';
import type { Selection, WeekWindowSpec } from '../team-roster.types';
import { hoursLabel, zoneShort } from '../utils/format';
import { MemberInspectorLayout } from './layout';
import type { Member } from './member.types';
import { Fact, MemberIdentity } from './parts/identity';
import { NoSelection, SlotSelection, TimeOffSelection } from './parts/selection';
import { WeekSchedule } from './parts/week-schedule';

/** The selected member's card, selection detail, and week; a composer nested in the roster. */
export function MemberInspector({
  now,
  lane,
  member,
  selection,
  windowSpec,
  focusDate,
  selectDate,
}: {
  now: number;
  lane: Lane;
  member: Member;
  selection: Selection;
  windowSpec: WeekWindowSpec;
  focusDate: string;
  selectDate: (localDate: string) => void;
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
      selectionZone={<SelectionDetail selection={selection} timezone={windowSpec.timezone} />}
      scheduleZone={
        <WeekSchedule
          now={now}
          lane={lane}
          windowSpec={windowSpec}
          focusDate={focusDate}
          selectDate={selectDate}
        />
      }
    />
  );
}

function SelectionDetail({
  selection,
  timezone,
}: {
  selection: Selection;
  timezone: string;
}): ReactNode {
  switch (selection.kind) {
    case 'timeOff':
      return <TimeOffSelection selection={selection} />;
    case 'slot':
      return <SlotSelection selection={selection} timezone={timezone} />;
    case 'none':
      return <NoSelection />;
  }
}
