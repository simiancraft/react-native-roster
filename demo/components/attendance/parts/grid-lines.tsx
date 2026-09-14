import { View } from 'react-native';
import type { GridInput } from 'react-native-roster';

export function AttendanceGridLines({ ticks, contentWidth }: GridInput) {
  return (
    <View pointerEvents="none" className="absolute h-full" style={{ width: contentWidth }}>
      {ticks.map((tick) => (
        <View
          key={tick.time}
          className="absolute top-0 bottom-0 w-px bg-grid"
          style={{ left: tick.x }}
        />
      ))}
    </View>
  );
}
