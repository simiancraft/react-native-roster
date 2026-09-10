import { Text, View } from 'react-native';
import { Roster, Schedule } from 'react-native-roster';
import type { ScheduleFixtureId } from '../../../../../test/fixtures/schedule';
import { replacedScheduleZones } from '../../../../../test/fixtures/schedule-zones';
import { FixtureLayout } from '../layout';
import { GalleryCounters } from '../parts/counters';
import { ScheduleControls } from './parts/controls';
import { useScheduleFixture } from './use-schedule-fixture';

export function ScheduleFixtureScreen({ fixtureId }: { fixtureId: ScheduleFixtureId }) {
  const model = useScheduleFixture(fixtureId);
  return (
    <FixtureLayout
      controlsZone={<ScheduleControls {...model} />}
      subjectZone={<ScheduleSubject model={model} />}
      countersZone={
        <>
          <GalleryCounters
            snapshot={{ ...model.snapshot, expanded: model.snapshot.expansion.expanded }}
            selection={model.selection}
          />
          <Text style={{ fontSize: 12, color: '#334155' }}>
            Expansion cache hits {model.snapshot.expansion.cacheHits}
          </Text>
        </>
      }
    />
  );
}

function ScheduleSubject({ model }: { model: ReturnType<typeof useScheduleFixture> }) {
  const { lane, windowSpec, minuteStep, navigate, selectRect, selectCell, view } = model;
  const zones =
    model.showsZoneExamples && model.zoneStyle === 'replacements' ? replacedScheduleZones : {};
  const props = {
    windowSpec,
    minuteStep,
    onNavigate: navigate,
    onIntervalPress: selectRect,
    onGapPress: selectRect,
    onCellPress: selectCell,
  };
  if (view === 'roster') return <Roster lanes={[lane]} {...props} />;
  if (view === 'schedule')
    return <Schedule lane={lane} pxPerHour={model.pxPerHour} {...props} {...zones} />;
  return (
    <View style={{ flex: 1, minHeight: 0, flexDirection: 'row', gap: 8 }}>
      <Roster lanes={[lane]} {...props} />
      <Schedule lane={lane} pxPerHour={model.pxPerHour} {...props} {...zones} />
    </View>
  );
}
