import { Text, View } from 'react-native';
import type { ScheduleProps } from '../../src';
import {
  ScheduleColumn,
  ScheduleDayHeader,
  ScheduleGutter,
  ScheduleSkippedDate,
  ScheduleTransition,
} from '../../src';
import { replacedZones } from './roster-zones';

export const replacedScheduleZones: Pick<
  ScheduleProps,
  | 'gutterZone'
  | 'dayHeaderZone'
  | 'skippedDateZone'
  | 'columnZone'
  | 'transitionZone'
  | 'nowLineZone'
  | 'intervalZone'
  | 'gapZone'
  | 'incompleteZone'
> = {
  gutterZone: (input) => (
    <View style={{ backgroundColor: '#e0e7ff' }}>
      <ScheduleGutter {...input} />
    </View>
  ),
  dayHeaderZone: (input) => (
    <View style={{ backgroundColor: '#e0e7ff' }}>
      <ScheduleDayHeader {...input} />
    </View>
  ),
  skippedDateZone: (input) => (
    <View style={{ width: 0, borderLeftWidth: 2, borderColor: '#7c3aed' }}>
      <ScheduleSkippedDate {...input} />
    </View>
  ),
  columnZone: (input) => (
    <View style={{ flex: 1, backgroundColor: '#faf5ff' }}>
      <ScheduleColumn {...input} />
    </View>
  ),
  transitionZone: (input) => (
    <>
      <ScheduleTransition {...input} />
      <Text
        pointerEvents="none"
        style={{ position: 'absolute', top: input.y, color: '#7c3aed', fontSize: 9 }}
      >
        Offset change
      </Text>
    </>
  ),
  nowLineZone: ({ y, column }) => (
    <View
      testID={`custom-now-${column}`}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: y,
        width: '100%',
        borderTopWidth: 3,
        borderColor: '#7c3aed',
      }}
    />
  ),
  intervalZone: replacedZones.intervalZone,
  gapZone: replacedZones.gapZone,
  incompleteZone: ({ lane, label }) => (
    <Text style={{ padding: 8, backgroundColor: '#ede9fe', color: '#5b21b6' }}>
      {lane.label}: {label}
    </Text>
  ),
};
