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
  | 'gutterComponent'
  | 'dayHeaderComponent'
  | 'skippedDateComponent'
  | 'columnComponent'
  | 'transitionComponent'
  | 'nowLineComponent'
  | 'intervalComponent'
  | 'gapComponent'
  | 'incompleteComponent'
> = {
  gutterComponent: (input) => (
    <View style={{ backgroundColor: '#e0e7ff' }}>
      <ScheduleGutter {...input} />
    </View>
  ),
  dayHeaderComponent: (input) => (
    <View style={{ backgroundColor: '#e0e7ff' }}>
      <ScheduleDayHeader {...input} />
    </View>
  ),
  skippedDateComponent: (input) => (
    <View style={{ width: 0, borderLeftWidth: 2, borderColor: '#7c3aed' }}>
      <ScheduleSkippedDate {...input} />
    </View>
  ),
  columnComponent: (input) => (
    <View style={{ flex: 1, backgroundColor: '#faf5ff' }}>
      <ScheduleColumn {...input} />
    </View>
  ),
  transitionComponent: (input) => (
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
  nowLineComponent: ({ y, column }) => (
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
  intervalComponent: replacedZones.intervalComponent,
  gapComponent: replacedZones.gapComponent,
  incompleteComponent: ({ lane, label }) => (
    <Text style={{ padding: 8, backgroundColor: '#ede9fe', color: '#5b21b6' }}>
      {lane.label}: {label}
    </Text>
  ),
};
