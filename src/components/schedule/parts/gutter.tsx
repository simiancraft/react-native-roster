import { Text, View } from 'react-native';

export function ScheduleGutter({ hours, pxPerHour }: { hours: number[]; pxPerHour: number }) {
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
