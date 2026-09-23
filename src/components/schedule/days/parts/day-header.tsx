import { Pressable, Text, View } from 'react-native';
import type { ScheduleDayHeaderInput } from '../../schedule.types';

export function ScheduleDayHeader({ day, onPress }: ScheduleDayHeaderInput) {
  const Container = onPress ? Pressable : View;
  return (
    <Container
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? day.localDate : undefined}
      onPress={onPress}
      style={{ paddingVertical: 4, alignItems: 'center', minHeight: 62 }}
    >
      <Text style={{ fontSize: 12, color: '#0f172a' }}>{day.label}</Text>
      <Text style={{ width: '100%', fontSize: 9, color: '#475569', textAlign: 'center' }}>
        {day.localDate}
      </Text>
      {day.transitions.length > 0 ? (
        <Text style={{ fontSize: 9, color: '#92400e' }}>Clock change</Text>
      ) : null}
    </Container>
  );
}
