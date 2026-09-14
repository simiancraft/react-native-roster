import type { ComponentType, ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { Text, View } from 'react-native';
import type { LaneLabelInput, RosterTick } from 'react-native-roster';
import { Roster } from 'react-native-roster';
import { TeamHeaderLayout } from './header-layout';
import { TeamRosterLayout } from './layout';
import { MemberInspector } from './members';
import { GeneratedNote } from './parts/generated-note';
import { TeamGridLines } from './parts/grid-lines';
import { DayHeaderCell, TeamCorner } from './parts/header-cell';
import { TeamInterval, TeamTimezone, TimeOffGap } from './parts/layer-fillers';
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
  titleComponent?: ComponentType<TeamRosterModel>;
  /** Trailing header actions; defaults to span chips and window navigation. */
  actionsComponent?: ComponentType<TeamRosterModel>;
  /** Above the people column; defaults to the text filter. */
  filterComponent?: ComponentType<TeamRosterModel>;
  /** Above the lanes; defaults to zone and sort chips. */
  controlsComponent?: ComponentType<TeamRosterModel>;
  /** The cell above the people column; defaults to the group label and count. */
  cornerComponent?: ComponentType<TeamRosterModel>;
  /** One person beside their lane; defaults to the avatar card at the current density. */
  laneLabelComponent?: ComponentType<MemberLabelProps>;
  /** Beside or below the roster; defaults to the member inspector. */
  inspectorComponent?: ComponentType<TeamRosterReady>;
  /** Under the roster; defaults to the legend and the generated-data note. */
  footerComponent?: ComponentType<TeamRosterModel>;
};

const DEFAULT_ZONES: Required<Omit<TeamRosterZones, 'backZone'>> = {
  titleComponent: (model) => (
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
  actionsComponent: (model) => (
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
  filterComponent: (model) => <PeopleFilter query={model.query} onChange={model.setQuery} />,
  controlsComponent: (model) => (
    <>
      <ZoneChips timezone={model.timezone} onChange={model.setTimezone} />
      <SortChips sort={model.sort} onChange={model.setSort} />
    </>
  ),
  cornerComponent: (model) => (
    <TeamCorner label="Team" count={model.lanes.length} density={model.density} />
  ),
  laneLabelComponent: (input) => <MemberLabel {...input} />,
  inspectorComponent: (model) => (
    <MemberInspector
      lane={model.selectedLane}
      member={model.selectedMember}
      selection={model.selection}
      windowSpec={model.windowSpec}
    />
  ),
  footerComponent: () => (
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
  const {
    titleComponent: Title,
    actionsComponent: Actions,
    filterComponent: Filter,
    controlsComponent: Controls,
    inspectorComponent: Inspector,
    footerComponent: Footer,
  } = zones;
  const chrome = {
    direction: model.contentDirection,
    onContentLayout: model.measureContent,
    headerZone: (
      <TeamHeaderLayout
        titleZone={
          <>
            {overrides.backZone}
            <Title {...model} />
          </>
        }
        actionsZone={<Actions {...model} />}
      />
    ),
    toolbarZone: (
      <TeamToolbarLayout
        filterWidth={model.labelWidth}
        direction={TOOLBAR_DIRECTION[model.density]}
        filterZone={<Filter {...model} />}
        controlsZone={<Controls {...model} />}
      />
    ),
    footerZone: <Footer {...model} />,
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
      inspectorZone={<Inspector {...model} />}
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
  const Corner = zones.cornerComponent;
  return (
    <TeamTimezone.Provider value={model.timezone}>
      <TeamLaneContext.Provider value={{ model, laneLabelComponent: zones.laneLabelComponent }}>
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
          cornerZone={<Corner {...model} />}
          headerCellComponent={TeamHeaderCell}
          gridComponent={TeamGridLines}
          laneLabelComponent={TeamLaneLabel}
          intervalComponent={TeamInterval}
          gapComponent={TimeOffGap}
        />
      </TeamLaneContext.Provider>
    </TeamTimezone.Provider>
  );
}

function NobodyMatches() {
  return (
    <View className="flex-1 items-center justify-center rounded-xl border border-border bg-card p-6">
      <Text className="text-sm text-muted-foreground">Nobody matches that filter.</Text>
    </View>
  );
}

const TeamLaneContext = createContext<{
  model: TeamRosterReady;
  /** Person label with density, selection, and press inputs. */
  laneLabelComponent: ComponentType<MemberLabelProps>;
} | null>(null);

function TeamHeaderCell({ tick }: { tick: RosterTick }) {
  const context = useContext(TeamLaneContext);
  if (!context) throw new Error('TeamHeaderCell requires the team roster');
  return (
    <DayHeaderCell tick={tick} timezone={context.model.timezone} density={context.model.density} />
  );
}

function TeamLaneLabel(input: LaneLabelInput) {
  const context = useContext(TeamLaneContext);
  if (!context) throw new Error('TeamLaneLabel requires the team roster');
  const { model, laneLabelComponent: Label } = context;
  return (
    <Label
      {...input}
      density={model.density}
      variant={input.lane.id === model.selectedLane.id ? 'selected' : 'idle'}
      onPress={() => model.selectMember(input.lane.id)}
    />
  );
}
