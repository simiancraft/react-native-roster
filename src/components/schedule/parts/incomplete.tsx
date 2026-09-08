import { Text } from 'react-native';
import type { Lane } from '../../../core';

export function ScheduleIncomplete({ lane, label }: { lane: Lane; label: string }) {
  return (
    <Text
      accessibilityLabel={`${lane.label}: ${label}`}
      style={{ padding: 8, color: '#9a3412', fontSize: 12 }}
    >
      {label}
    </Text>
  );
}
