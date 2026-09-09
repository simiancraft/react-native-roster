import { Text, View } from 'react-native';
import { Roster } from 'react-native-roster';
import { TeamRosterLayout } from './layout';
import { DayHeaderCell, TeamCorner } from './parts/header-cell';
import { MemberInspector } from './parts/inspector';
import { AvailabilityBand, EventCard, TimeOffGap } from './parts/interval';
import { TeamLegend } from './parts/legend';
import { MemberLabel } from './parts/member-label';
import { TeamToolbar } from './parts/toolbar';
import { useTeamRoster } from './use-team-roster';

export function TeamRosterScreen() {
  const model = useTeamRoster();
  const { lanes, windowSpec, timezone, selectedLane, selectedMember, selection } = model;
  const inspectorZone =
    selectedLane && selectedMember && selection ? (
      <MemberInspector
        lane={selectedLane}
        member={selectedMember}
        selection={selection}
        windowSpec={windowSpec}
      />
    ) : (
      <View className="flex-1 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <Text className="text-sm text-zinc-500">Nobody matches that filter.</Text>
      </View>
    );
  return (
    <TeamRosterLayout
      contentDirection={model.contentDirection}
      onContentLayout={model.measureContent}
      toolbarZone={<TeamToolbar {...model} />}
      legendZone={<TeamLegend />}
      inspectorZone={inspectorZone}
      subjectZone={
        <Roster
          lanes={lanes}
          windowSpec={windowSpec}
          minuteStep={60}
          pxPerMinute={model.pxPerMinute}
          rowHeight={56}
          laneLabelWidth={232}
          sortLanes={model.sortLanes}
          onNavigate={() => undefined}
          onIntervalPress={model.selectRect}
          onIntervalHover={undefined}
          onGapPress={model.selectGap}
          onCellPress={model.selectCell}
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950"
          headerClassName="border-b border-zinc-800 bg-zinc-900"
          laneLabelColumnClassName="border-r border-zinc-800 bg-zinc-900/60"
          bodyClassName="bg-zinc-950"
          cornerZone={() => <TeamCorner count={lanes.length} />}
          headerCellZone={({ tick }) => <DayHeaderCell tick={tick} timezone={timezone} />}
          gridZone={({ ticks, contentWidth }) => (
            <View pointerEvents="none" style={{ width: contentWidth }} className="absolute h-full">
              {ticks.map((tick) => (
                <View
                  key={tick.time}
                  style={{ left: tick.x }}
                  className={
                    tick.kind === 'day'
                      ? 'absolute top-0 bottom-0 w-px bg-zinc-700'
                      : 'absolute top-0 bottom-0 w-px bg-zinc-800/60'
                  }
                />
              ))}
            </View>
          )}
          laneLabelZone={(input) => (
            <MemberLabel
              {...input}
              variant={input.lane.id === selectedLane?.id ? 'selected' : 'idle'}
              onPress={() => model.selectMember(input.lane.id)}
            />
          )}
          intervalZone={(input) =>
            input.layer.role === 'booking' ? (
              <EventCard {...input} timezone={timezone} />
            ) : (
              <AvailabilityBand {...input} />
            )
          }
          gapZone={TimeOffGap}
          emptyZone={() => (
            <View className="flex-1 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950">
              <Text className="text-sm text-zinc-500">Nobody matches that filter.</Text>
            </View>
          )}
        />
      }
    />
  );
}
