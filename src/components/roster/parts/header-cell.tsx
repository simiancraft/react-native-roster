import { Text } from 'react-native';
import type { HeaderCellInput } from '../roster.types';

export function RosterHeaderCell({ tick }: HeaderCellInput) {
  return (
    <Text numberOfLines={1} style={{ color: '#475569', fontSize: 11, padding: 4 }}>
      {tick.label}
    </Text>
  );
}
