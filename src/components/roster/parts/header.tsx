import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { HeaderInput } from '../roster.types';

export function RosterHeader({ ticks, contentWidth, scroll, headerCellZone }: HeaderInput) {
  return (
    <Animated.View
      testID="roster-header"
      style={[{ width: contentWidth, height: 40 }, scroll.headerStyle]}
    >
      {ticks.map((tick) => (
        <View key={tick.time} style={{ position: 'absolute', left: tick.x, top: 0 }}>
          {headerCellZone({ tick })}
        </View>
      ))}
    </Animated.View>
  );
}
