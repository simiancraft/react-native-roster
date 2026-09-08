import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { LabelColumnInput } from '../roster.types';

export function RosterLaneLabelColumn({
  labels,
  projection,
  scroll,
  laneLabelZone,
}: LabelColumnInput) {
  return (
    <Animated.View
      testID="roster-labels"
      style={[{ height: labels.length * projection.rowHeight }, scroll.labelStyle]}
    >
      {labels.map((label, index) => (
        <View
          key={label.lane.id}
          style={{
            position: 'absolute',
            top: index * projection.rowHeight,
            height: projection.rowHeight,
            width: '100%',
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0',
          }}
        >
          {laneLabelZone(label)}
        </View>
      ))}
    </Animated.View>
  );
}
