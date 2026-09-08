import { Text } from 'react-native';
import type { RosterTick } from '../roster.types';

export function RosterHeaderCell({ tick }: { tick: RosterTick }) {
  return (
    <Text numberOfLines={1} style={{ color: '#475569', fontSize: 11, padding: 4 }}>
      {tick.label}
    </Text>
  );
}
