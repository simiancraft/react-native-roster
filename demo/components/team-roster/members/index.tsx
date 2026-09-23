import type { ReactNode } from 'react';
import type { Lane, Rect, Window } from 'react-native-roster/core';
import type { InspectorLink, Selection, WeekWindowSpec } from '../team-roster.types';
import { hoursLabel, zoneShort } from '../utils/format';
import { MemberInspectorLayout } from './layout';
import type { Member } from './member.types';
import { Fact, MemberIdentity } from './parts/identity';
import { NoSelection, SlotSelection, TimeOffSelection } from './parts/selection';
import { WeekSchedule } from './parts/week-schedule';
import { WeekNavigation } from './parts/week-zones';

/** The selected member's card, selection detail, and week; a composer nested in the roster. */
export function MemberInspector({
  now,
  lane,
  member,
  selection,
  windowSpec,
  rosterWindow,
  focusDate,
  inspectorLink,
  goPrev,
  goNext,
  linkToRoster,
  selectDate,
  selectCell,
  selectGap,
}: {
  now: number;
  lane: Lane;
  member: Member;
  selection: Selection;
  windowSpec: WeekWindowSpec;
  rosterWindow: Window;
  focusDate: string;
  inspectorLink: InspectorLink;
  goPrev: () => void;
  goNext: () => void;
  linkToRoster: () => void;
  selectDate: (localDate: string) => void;
  selectCell: (time: number) => void;
  selectGap: (rect: Rect) => void;
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
      navigationZone={
        <WeekNavigation
          focusDate={focusDate}
          link={inspectorLink}
          onPrev={goPrev}
          onNext={goNext}
          onLink={linkToRoster}
        />
      }
      selectionZone={<SelectionDetail selection={selection} timezone={windowSpec.timezone} />}
      scheduleZone={
        <WeekSchedule
          now={now}
          lane={lane}
          windowSpec={windowSpec}
          rosterWindow={rosterWindow}
          focusDate={focusDate}
          selectDate={selectDate}
          selectCell={selectCell}
          selectGap={selectGap}
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
