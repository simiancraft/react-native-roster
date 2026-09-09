import { Text, View } from 'react-native';
import type { ScheduleHoursInput } from '../schedule.types';

export function ScheduleGutter({ hours, pxPerHour }: ScheduleHoursInput) {
  return (
    <View>
      {hours.map((hour) => (
        <View key={hour} style={{ height: pxPerHour }}>
          <Text style={{ fontSize: 10, color: '#64748b', padding: 3 }}>
            {String(hour).padStart(2, '0')}:00
          </Text>
        </View>
      ))}
    </View>
  );
}
