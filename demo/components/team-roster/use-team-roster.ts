import { useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type { ScheduleWindowSpec } from 'react-native-roster';
import type { Lane, LaneComparator, Rect, WindowSpec } from 'react-native-roster/core';
import { byCoverage, byLabel, next, prev, today, windowFor } from 'react-native-roster/core';
import { expandRuleSet } from 'react-native-roster/rrule';
import { laneFor, type Member, type MemberEvent, memberMeta, teamFor } from './utils/team';
import { TONE_HEX } from './utils/tones';

export const VIEW_TIMEZONES = ['America/Chicago', 'Europe/London', 'Asia/Tokyo', 'UTC'] as const;
export type SortKey = 'name' | 'availability' | 'free';
export type Selection =
  | { kind: 'event'; member: Member; event: MemberEvent }
  | { kind: 'timeOff'; member: Member; note: string }
  | { kind: 'slot'; member: Member; time: number }
  | { kind: 'none'; member: Member };

export type SpanKey = ScheduleWindowSpec['span'];
const INITIAL: ScheduleWindowSpec = {
  span: 'day',
  anchorDate: '2026-01-05',
  timezone: 'America/Chicago',
};
function bounded(spec: WindowSpec): ScheduleWindowSpec {
  if (spec.span === 'custom') return INITIAL;
  return { ...spec, span: spec.span === 'week' ? 'week' : 'day' };
}
/** Week overviews scroll at 42 px per hour so hour ticks stay legible. */
const PX_PER_MINUTE: Record<SpanKey, number> = { day: 0.5, week: 0.7 };
const SORTS: Record<SortKey, LaneComparator> = {
  name: byLabel,
  availability: byCoverage({ measure: 'availability' }),
  free: byCoverage({ measure: 'availabilityMinusBooking' }),
};

export function useTeamRoster() {
  const [members] = useState(() => teamFor());
  const [windowSpec, setWindowSpec] = useState<ScheduleWindowSpec>(() => bounded(today(INITIAL)));
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [selectedId, setSelectedId] = useState(members[0]?.id ?? '');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [contentWidth, setContentWidth] = useState(1280);
  const window = windowFor(windowSpec);
  const visible = members.filter((member) =>
    `${member.name} ${member.role} ${member.team} ${member.timezone}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const lanes = visible.map((member) =>
    laneFor(member, window, expandRuleSet, (person) => TONE_HEX[person.tone]),
  );
  const selectedLane = lanes.find((lane) => lane.id === selectedId) ?? lanes[0] ?? null;
  const selectedMember = selectedLane ? memberMeta(selectedLane).member : null;
  const currentSelection: Selection | null =
    selection && selectedMember && selection.member.id === selectedMember.id
      ? selection
      : selectedMember
        ? { kind: 'none', member: selectedMember }
        : null;
  function selectRect(rect: Rect, lane: Lane) {
    const { member, events } = memberMeta(lane);
    setSelectedId(member.id);
    const source = rect.sources[0];
    const event = events.find((candidate) => candidate.id === source?.id);
    if (event) setSelection({ kind: 'event', member, event });
    else if (source?.kind === 'rule')
      setSelection({ kind: 'timeOff', member, note: 'Lunch break' });
    else if (source?.kind === 'date')
      setSelection({ kind: 'timeOff', member, note: source.label ?? 'Out of office' });
    else setSelection({ kind: 'none', member });
  }
  return {
    status: 'ready' as const,
    members,
    lanes,
    window,
    windowSpec,
    timezone: windowSpec.timezone,
    span: windowSpec.span,
    pxPerMinute: PX_PER_MINUTE[windowSpec.span],
    setSpan: (span: SpanKey) => setWindowSpec((spec) => ({ ...spec, span })),
    query,
    sort,
    sortLanes: SORTS[sort],
    selectedLane,
    selectedMember,
    selection: currentSelection,
    contentDirection: contentWidth < 960 ? ('column' as const) : ('row' as const),
    measureContent: (input: LayoutChangeEvent) => setContentWidth(input.nativeEvent.layout.width),
    setQuery,
    setSort,
    goPrev: () => setWindowSpec((spec) => bounded(prev(spec))),
    goNext: () => setWindowSpec((spec) => bounded(next(spec))),
    goToday: () => setWindowSpec((spec) => bounded(today(spec))),
    setTimezone: (timezone: string) => setWindowSpec((spec) => ({ ...spec, timezone })),
    selectMember: (id: string) => {
      setSelectedId(id);
      setSelection(null);
    },
    selectRect,
    selectGap: selectRect,
    selectCell: (lane: Lane, time: number) => {
      const { member } = memberMeta(lane);
      setSelectedId(member.id);
      setSelection({ kind: 'slot', member, time });
    },
  };
}

export type TeamRosterModel = ReturnType<typeof useTeamRoster>;
