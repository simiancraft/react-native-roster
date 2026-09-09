import { View } from 'react-native';
import type { GridInput } from '../roster.types';

export function RosterGrid({ ticks, contentWidth }: GridInput) {
  return (
    <View
      testID="roster-grid"
      pointerEvents="none"
      style={{ position: 'absolute', width: contentWidth, height: '100%' }}
    >
      {ticks.map((tick) => (
        <View
          key={tick.time}
          style={{
            position: 'absolute',
            left: tick.x,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: '#e2e8f0',
          }}
        />
      ))}
    </View>
  );
}
