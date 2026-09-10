import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Roster, Schedule } from 'react-native-roster';
import type { ScheduleFixtureId } from '../../../../../test/fixtures/schedule';
import { replacedScheduleZones } from '../../../../../test/fixtures/schedule-zones';
import { FixtureLayout } from '../layout';
import { GalleryCounters } from '../parts/counters';
import { ScheduleControls } from './parts/controls';
import { ExpansionNote } from './parts/expansion-note';
import { useScheduleFixture } from './use-schedule-fixture';

type ScheduleFixtureModel = ReturnType<typeof useScheduleFixture>;

export function ScheduleFixtureScreen({ fixtureId }: { fixtureId: ScheduleFixtureId }) {
  const model = useScheduleFixture(fixtureId);
  return (
    <FixtureLayout
      controlsZone={<ScheduleControls {...model} />}
      subjectZone={SUBJECTS[model.view](model)}
      countersZone={
        <>
          <GalleryCounters
            snapshot={{ ...model.snapshot, expanded: model.snapshot.expansion.expanded }}
            selection={model.selection}
          />
          <ExpansionNote cacheHits={model.snapshot.expansion.cacheHits} />
        </>
      }
    />
  );
}

function subjectProps(model: ScheduleFixtureModel) {
  const { windowSpec, minuteStep, navigate, selectRect, selectCell } = model;
  return {
    windowSpec,
    minuteStep,
    onNavigate: navigate,
    onIntervalPress: selectRect,
    onGapPress: selectRect,
    onCellPress: selectCell,
  };
}

function scheduleZones(model: ScheduleFixtureModel) {
  return model.showsZoneExamples && model.zoneStyle === 'replacements' ? replacedScheduleZones : {};
}

/** One subject per view; the same lane through one projection, the other, or both. */
const SUBJECTS: Record<ScheduleFixtureModel['view'], (model: ScheduleFixtureModel) => ReactNode> = {
  roster: (model) => <Roster lanes={[model.lane]} {...subjectProps(model)} />,
  schedule: (model) => (
    <Schedule
      lane={model.lane}
      pxPerHour={model.pxPerHour}
      {...subjectProps(model)}
      {...scheduleZones(model)}
    />
  ),
  both: (model) => (
    <View className="flex-1 min-h-0 flex-row gap-2">
      <Roster lanes={[model.lane]} {...subjectProps(model)} />
      <Schedule
        lane={model.lane}
        pxPerHour={model.pxPerHour}
        {...subjectProps(model)}
        {...scheduleZones(model)}
      />
    </View>
  ),
};
