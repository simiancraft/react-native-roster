import { View } from 'react-native';
import type { ScheduleHoursInput } from '../../schedule.types';

export function ScheduleGrid({ hours, pxPerHour }: ScheduleHoursInput) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: '100%' }}>
      {hours.map((hour) => (
        <View
          key={hour}
          testID="schedule-hour-band"
          style={{
            height: pxPerHour,
            borderTopWidth: 1,
            borderRightWidth: 1,
            borderColor: '#e2e8f0',
          }}
        />
      ))}
    </View>
  );
}
