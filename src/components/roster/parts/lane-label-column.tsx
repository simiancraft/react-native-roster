import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { LabelColumnInput } from '../roster.types';
import { labelWheelProps } from './label-wheel';

export function RosterLaneLabelColumn({
  labels,
  projection,
  scroll,
  laneLabelComponent: LaneLabelComponent,
}: LabelColumnInput) {
  const labelWheel = labelWheelProps(scroll);
  return (
    <Animated.View
      {...labelWheel}
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
          }}
        >
          <LaneLabelComponent {...label} />
        </View>
      ))}
    </Animated.View>
  );
}
