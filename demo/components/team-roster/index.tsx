import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Roster } from 'react-native-roster';
import { TeamHeaderLayout } from './header-layout';
import { TeamRosterLayout } from './layout';
import { MemberInspector } from './members';
import { GeneratedNote } from './parts/generated-note';
import { TeamGridLines } from './parts/grid-lines';
import { DayHeaderCell, TeamCorner } from './parts/header-cell';
import { intervalFillerFor, TimeOffGap } from './parts/layer-fillers';
import { TeamLegend } from './parts/legend';
import { MemberLabel, type MemberLabelProps } from './parts/member-label';
import { TeamTitle, WindowRange } from './parts/title';
import { PeopleFilter, SortChips, SpanChips, WindowNav, ZoneChips } from './parts/window-controls';
import type { Density, Team } from './team-roster.types';
import { TeamToolbarLayout } from './toolbar-layout';
import { type TeamRosterModel, type TeamRosterReady, useTeamRoster } from './use-team-roster';

/**
 * Host-facing slots. Each receives the resolved model and defaults to the
 * showcase part, so an app swaps one region without touching the others.
 */
export type TeamRosterZones = {
  /** Above the title: a back link or breadcrumb. */
  backZone?: ReactNode;
  /** Title and window range; defaults to the organization name and the visible range. */
  titleZone?: (model: TeamRosterModel) => ReactNode;
  /** Trailing header actions; defaults to span chips and window navigation. */
  actionsZone?: (model: TeamRosterModel) => ReactNode;
  /** Above the people column; defaults to the text filter. */
  filterZone?: (model: TeamRosterModel) => ReactNode;
  /** Above the lanes; defaults to zone and sort chips. */
  controlsZone?: (model: TeamRosterModel) => ReactNode;
  /** The cell above the people column; defaults to the group label and count. */
  cornerZone?: (model: TeamRosterModel) => ReactNode;
  /** One person beside their lane; defaults to the avatar card at the current density. */
  laneLabelZone?: (input: MemberLabelProps) => ReactNode;
  /** Beside or below the roster; defaults to the member inspector. */
  inspectorZone?: (model: TeamRosterReady) => ReactNode;
  /** Under the roster; defaults to the legend and the generated-data note. */
  footerZone?: (model: TeamRosterModel) => ReactNode;
};

const DEFAULT_ZONES: Required<Omit<TeamRosterZones, 'backZone'>> = {
  titleZone: (model) => (
    <>
      <TeamTitle title={model.organization} />
      <WindowRange
        window={model.window}
        timezone={model.timezone}
        density={model.density}
        shown={model.lanes.length}
        total={model.members.length}
      />
    </>
  ),
  actionsZone: (model) => (
    <>
      <SpanChips span={model.span} onChange={model.setSpan} />
      <WindowNav
        span={model.span}
        onPrev={model.goPrev}
        onToday={model.goToday}
        onNext={model.goNext}
      />
    </>
  ),
  filterZone: (model) => <PeopleFilter query={model.query} onChange={model.setQuery} />,
  controlsZone: (model) => (
    <>
      <ZoneChips timezone={model.timezone} onChange={model.setTimezone} />
      <SortChips sort={model.sort} onChange={model.setSort} />
    </>
  ),
  cornerZone: (model) => (
    <TeamCorner label="Team" count={model.lanes.length} density={model.density} />
  ),
  laneLabelZone: (input) => <MemberLabel {...input} />,
  inspectorZone: (model) => (
    <MemberInspector
      lane={model.selectedLane}
      member={model.selectedMember}
      selection={model.selection}
      windowSpec={model.windowSpec}
    />
  ),
  footerZone: () => (
    <>
      <TeamLegend />
      <GeneratedNote />
    </>
  ),
};

/** Where the filter sits at each people-column density; avatars are too narrow for a filter beside the lanes. */
const TOOLBAR_DIRECTION: Record<Density, 'row' | 'column'> = {
  full: 'row',
  compact: 'row',
  avatar: 'column',
};

export function TeamRosterScreen({ team, ...overrides }: TeamRosterZones & { team?: Team }) {
  const model = useTeamRoster({ team });
  const zones = { ...DEFAULT_ZONES, ...overrides };
  const chrome = {
    direction: model.contentDirection,
    onContentLayout: model.measureContent,
    headerZone: (
      <TeamHeaderLayout
        titleZone={
          <>
            {overrides.backZone}
            {zones.titleZone(model)}
          </>
        }
        actionsZone={zones.actionsZone(model)}
      />
    ),
    toolbarZone: (
      <TeamToolbarLayout
        filterWidth={model.labelWidth}
        direction={TOOLBAR_DIRECTION[model.density]}
        filterZone={zones.filterZone(model)}
        controlsZone={zones.controlsZone(model)}
      />
    ),
    footerZone: zones.footerZone(model),
  };
  if (model.status === 'empty')
    return (
      <TeamRosterLayout
        {...chrome}
        subjectZone={<NobodyMatches />}
        inspectorZone={<NobodyMatches />}
      />
    );
  return (
    <TeamRosterLayout
      {...chrome}
      inspectorZone={zones.inspectorZone(model)}
      subjectZone={<TeamRoster model={model} zones={zones} />}
    />
  );
}

function TeamRoster({
  model,
  zones,
}: {
  model: TeamRosterReady;
  zones: Required<Omit<TeamRosterZones, 'backZone'>>;
}) {
  const { timezone, density } = model;
  return (
    <Roster
      lanes={model.lanes}
      windowSpec={model.windowSpec}
      minuteStep={60}
      pxPerMinute={model.pxPerMinute}
      rowHeight={56}
      laneLabelWidth={model.labelWidth}
      sortLanes={model.sortLanes}
      onIntervalPress={model.selectRect}
      onGapPress={model.selectGap}
      onCellPress={model.selectCell}
      className="flex-1 rounded-xl border border-border bg-background"
      headerClassName="border-b border-border bg-card"
      laneLabelColumnClassName="border-r border-border bg-card/60"
      bodyClassName="bg-background"
      cornerZone={() => zones.cornerZone(model)}
      headerCellZone={({ tick }) => (
        <DayHeaderCell tick={tick} timezone={timezone} density={density} />
      )}
      gridZone={TeamGridLines}
      laneLabelZone={(input) =>
        zones.laneLabelZone({
          ...input,
          density,
          variant: input.lane.id === model.selectedLane.id ? 'selected' : 'idle',
          onPress: () => model.selectMember(input.lane.id),
        })
      }
      intervalZone={intervalFillerFor(timezone)}
      gapZone={TimeOffGap}
    />
  );
}

function NobodyMatches() {
  return (
    <View className="flex-1 items-center justify-center rounded-xl border border-border bg-card p-6">
      <Text className="text-sm text-muted-foreground">Nobody matches that filter.</Text>
    </View>
  );
}
