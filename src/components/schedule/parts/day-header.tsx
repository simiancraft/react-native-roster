import { Text, View } from 'react-native';
import type { DayColumn } from '../../../core';

export function ScheduleDayHeader({ day }: { day: DayColumn }) {
  const badge =
    day.transitions.length > 0 ? (
      <Text style={{ fontSize: 9, color: '#92400e' }}>Clock change</Text>
    ) : null;
  return (
    <View style={{ paddingVertical: 4, alignItems: 'center', minHeight: 62 }}>
      <Text style={{ fontSize: 12, color: '#0f172a' }}>{day.label}</Text>
      <Text style={{ width: '100%', fontSize: 9, color: '#475569', textAlign: 'center' }}>
        {day.localDate}
      </Text>
      {badge}
    </View>
  );
}
