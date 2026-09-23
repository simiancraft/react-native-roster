import type { ComponentType, ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { Text } from 'react-native';
import type { LaneLabelInput, RosterTick } from 'react-native-roster';
import { Roster } from 'react-native-roster';
import { SiteFooter } from '../site-footer';
import { Card } from '../ui/card';
import { EventDetail } from './events';
import { TeamHeaderLayout } from './header-layout';
import { MemberInspector } from './members';
import { GeneratedNote } from './parts/generated-note';
import { TeamGridLines } from './parts/grid-lines';
import { DayHeaderCell, TeamCorner } from './parts/header-cell';
import { TeamInterval, TeamTimezone, TimeOffGap } from './parts/layer-fillers';
import { TeamLegend } from './parts/legend';
import { MemberLabel, type MemberLabelProps } from './parts/member-label';
import { TeamTitle, WindowRange } from './parts/title';
import {
  PeopleFilter,
  SortChips,
  SpanChips,
  WeekDensityChips,
  WindowNav,
  ZoneChips,
} from './parts/window-controls';
import { TeamRosterLayout } from './screen-layout';
import type { Density, Team } from './team-roster.types';
import { TeamToolbarLayout } from './toolbar-layout';
import { type TeamRosterModel, type TeamRosterReady, useTeamRoster } from './use-team-roster';
import { timeLabel } from './utils/format';

/**
 * Host-facing slots. Each receives the resolved model and defaults to the
 * showcase part, so an app swaps one region without touching the others.
 */
export type TeamRosterSlots = {
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

/** Where the filter sits at each people-column density; avatars are too narrow for a filter beside the lanes. */
const TOOLBAR_DIRECTION: Record<Density, 'row' | 'column'> = {
  full: 'row',
  compact: 'row',
  avatar: 'column',
};

export function TeamRosterScreen({
  team,
  backZone,
  titleComponent: Title = DefaultTitle,
  actionsComponent: Actions = DefaultActions,
  filterComponent: Filter = DefaultFilter,
  controlsComponent: Controls = DefaultControls,
  cornerComponent: Corner = DefaultCorner,
  laneLabelComponent: Label = MemberLabel,
  inspectorComponent: Inspector = DefaultInspector,
  footerComponent: Footer = DefaultFooter,
}: TeamRosterSlots & { team?: Team }) {
  const model = useTeamRoster({ team });
  const chrome = {
    direction: model.contentDirection,
    onContentLayout: model.measureContent,
    headerZone: (
      <TeamHeaderLayout
        titleZone={
          <>
            {backZone}
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
      subjectZone={
        <TeamRoster model={model} slots={{ cornerComponent: Corner, laneLabelComponent: Label }} />
      }
    />
  );
}

function TeamRoster({
  model,
  slots,
}: {
  model: TeamRosterReady;
  slots: Required<Pick<TeamRosterSlots, 'cornerComponent' | 'laneLabelComponent'>>;
}) {
  const Corner = slots.cornerComponent;
  return (
    <TeamTimezone.Provider value={model.timezone}>
      <TeamLaneContext.Provider value={{ model, laneLabelComponent: slots.laneLabelComponent }}>
        <Roster
          now={model.now}
          lanes={model.lanes}
          windowSpec={model.windowSpec}
          minuteStep={60}
          pxPerMinute={model.pxPerMinute}
          rowHeight={56}
          laneLabelWidth={model.labelWidth}
          sortLanes={model.sortLanes}
          onIntervalPress={model.selectInterval}
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
          intervalDetailComponent={EventDetail}
          gapComponent={TimeOffGap}
        />
      </TeamLaneContext.Provider>
    </TeamTimezone.Provider>
  );
}

function NobodyMatches() {
  return (
    <Card
      className="flex-1 items-center justify-center p-6"
      contentZone={
        <Text className="text-sm text-muted-foreground">Nobody matches that filter.</Text>
      }
    />
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
    <DayHeaderCell
      tick={tick}
      timezone={context.model.timezone}
      density={context.model.density}
      span={context.model.span}
    />
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

function DefaultTitle(model: TeamRosterModel) {
  return (
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
  );
}
function DefaultActions(model: TeamRosterModel) {
  return (
    <>
      <SpanChips span={model.span} onChange={model.setSpan} />
      {model.span === 'week' ? (
        <WeekDensityChips density={model.weekDensity} onChange={model.setWeekDensity} />
      ) : null}
      <WindowNav
        span={model.span}
        onPrev={model.goPrev}
        onToday={model.goToday}
        onNext={model.goNext}
      />
    </>
  );
}
function DefaultFilter(model: TeamRosterModel) {
  return <PeopleFilter query={model.query} onChange={model.setQuery} />;
}
function DefaultControls(model: TeamRosterModel) {
  return (
    <>
      <ZoneChips timezone={model.timezone} onChange={model.setTimezone} />
      <SortChips sort={model.sort} onChange={model.setSort} />
      <Text className="text-xs text-muted-foreground">
        Now {timeLabel(model.now, model.timezone)}
      </Text>
    </>
  );
}
function DefaultCorner(model: TeamRosterModel) {
  return <TeamCorner label="Team" count={model.lanes.length} density={model.density} />;
}
function DefaultInspector(model: TeamRosterReady) {
  return (
    <MemberInspector
      lane={model.weekLane}
      member={model.selectedMember}
      selection={model.selection}
      windowSpec={model.weekWindowSpec}
      focusDate={model.windowSpec.anchorDate}
      selectDate={model.selectDate}
    />
  );
}
function DefaultFooter() {
  return (
    <>
      <TeamLegend />
      <GeneratedNote />
      <SiteFooter density="compact" />
    </>
  );
}
