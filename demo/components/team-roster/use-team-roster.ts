import { useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type { ScheduleWindowSpec } from 'react-native-roster';
import type { Lane, LaneComparator, Rect, WindowSpec } from 'react-native-roster/core';
import { byCoverage, byLabel, next, prev, windowFor } from 'react-native-roster/core';
import { expandRuleSet } from 'react-native-roster/rrule';
import type { Member } from './members/member.types';
import type { Density, Selection, SortKey, SpanKey, Team } from './team-roster.types';
import { selectionFor } from './utils/selection';
import { laneFor, memberMeta, seededNow, teamFor } from './utils/team';
import { TONE_HEX } from './utils/tones';

const INITIAL: ScheduleWindowSpec = {
  span: 'day',
  anchorDate: '2026-01-05',
  timezone: 'America/Chicago',
};
function bounded(spec: WindowSpec): ScheduleWindowSpec {
  if (spec.span === 'custom') return INITIAL;
  return { ...spec, span: spec.span === 'week' ? 'week' : 'day' };
}
/** A day scrolls once the lanes are narrower than 1152 px; a week scrolls at 42 px per hour. */
const PX_PER_MINUTE: Record<SpanKey, number> = { day: 0.8, week: 0.7 };
const SORTS: Record<SortKey, LaneComparator> = {
  name: byLabel,
  availability: byCoverage({ measure: 'availability' }),
  free: byCoverage({ measure: 'availabilityMinusBooking' }),
};
const LABEL_WIDTH: Record<Density, number> = { full: 232, compact: 148, avatar: 56 };

function densityFor(width: number): Density {
  if (width >= 960) return 'full';
  if (width >= 600) return 'compact';
  return 'avatar';
}

/** The team to show; the showcase generates one when the host supplies none. */
export function useTeamRoster(input: { team?: Team } = {}) {
  const [generated] = useState(() => input.team ?? teamFor());
  const team = input.team ?? generated;
  const [now] = useState(seededNow);
  const [windowSpec, setWindowSpec] = useState<ScheduleWindowSpec>(INITIAL);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [selectedId, setSelectedId] = useState(team.members[0]?.id ?? '');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [contentWidth, setContentWidth] = useState(1280);
  const window = windowFor(windowSpec);
  const weekWindowSpec: ScheduleWindowSpec = { ...windowSpec, span: 'week' };
  const weekWindow = windowFor(weekWindowSpec);
  const [retained, setRetained] = useState(() => generatedLanes(team, window, weekWindow, now));
  let data = retained;
  if (
    retained.team !== team ||
    retained.now !== now ||
    retained.start !== window.start ||
    retained.end !== window.end ||
    retained.weekStart !== weekWindow.start ||
    retained.weekEnd !== weekWindow.end
  ) {
    data = generatedLanes(team, window, weekWindow, now);
    setRetained(data);
  }
  const lanes = data.lanes.filter((lane) => {
    const member = memberMeta(lane).member;
    return `${member.name} ${member.role} ${member.team} ${member.timezone}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });
  const density = densityFor(contentWidth);
  function selectRect(rect: Rect, lane: Lane) {
    const { member } = memberMeta(lane);
    setSelectedId(member.id);
    setSelection(selectionFor(member, rect));
  }
  const common = {
    now,
    organization: team.organization,
    members: team.members,
    lanes,
    window,
    windowSpec,
    timezone: windowSpec.timezone,
    span: windowSpec.span,
    pxPerMinute: PX_PER_MINUTE[windowSpec.span],
    query,
    sort,
    sortLanes: SORTS[sort],
    density,
    labelWidth: LABEL_WIDTH[density],
    contentDirection: contentWidth < 960 ? ('column' as const) : ('row' as const),
    measureContent: (input: LayoutChangeEvent) => setContentWidth(input.nativeEvent.layout.width),
    setQuery,
    setSort,
    setSpan: (span: SpanKey) => setWindowSpec((spec) => ({ ...spec, span })),
    goPrev: () => setWindowSpec((spec) => bounded(prev(spec))),
    goNext: () => setWindowSpec((spec) => bounded(next(spec))),
    goToday: () => setWindowSpec((spec) => ({ ...spec, anchorDate: INITIAL.anchorDate })),
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
  const selectedLane = lanes.find((lane) => lane.id === selectedId) ?? lanes[0];
  if (!selectedLane) return { status: 'empty' as const, ...common };
  const selectedMember: Member = memberMeta(selectedLane).member;
  const currentSelection: Selection =
    selection && selection.member.id === selectedMember.id
      ? selection
      : { kind: 'none', member: selectedMember };
  return {
    status: 'ready' as const,
    ...common,
    selectedLane,
    weekLane: data.weekLanes.find((lane) => lane.id === selectedLane.id) as Lane,
    weekWindowSpec,
    selectedMember,
    selection: currentSelection,
  };
}

export type TeamRosterModel = ReturnType<typeof useTeamRoster>;
export type TeamRosterReady = Extract<TeamRosterModel, { status: 'ready' }>;

function generatedLanes(
  team: Team,
  window: { start: number; end: number },
  week: { start: number; end: number },
  now: number,
) {
  function expand(member: Member, bounds: { start: number; end: number }) {
    return laneFor(
      member,
      bounds,
      expandRuleSet,
      (person) => TONE_HEX[person.tone],
      team.members,
      now,
    );
  }
  return {
    team,
    now,
    start: window.start,
    end: window.end,
    weekStart: week.start,
    weekEnd: week.end,
    lanes: team.members.map((member) => expand(member, window)),
    weekLanes: team.members.map((member) => expand(member, week)),
  };
}
