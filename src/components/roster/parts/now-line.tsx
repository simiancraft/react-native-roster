import { View } from 'react-native';
import type { RosterNowLineInput } from '../roster.types';

export function RosterNowLine({ x }: RosterNowLineInput) {
  return (
    <View
      testID="roster-now-line"
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: '#dc2626',
      }}
    />
  );
}
