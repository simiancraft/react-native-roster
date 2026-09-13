import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { HeaderInput } from '../roster.types';

export function RosterHeader({
  ticks,
  contentWidth,
  scroll,
  headerCellComponent: HeaderCellComponent,
}: HeaderInput) {
  return (
    <Animated.View
      testID="roster-header"
      style={[{ width: contentWidth, height: 40 }, scroll.headerStyle]}
    >
      {ticks.map((tick) => (
        <View key={tick.time} style={{ position: 'absolute', left: tick.x, top: 0 }}>
          <HeaderCellComponent tick={tick} />
        </View>
      ))}
    </Animated.View>
  );
}
