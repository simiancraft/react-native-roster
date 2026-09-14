import { View } from 'react-native';
import type { IntervalInput } from 'react-native-roster';
import { TOGETHER_FILL } from '../utils/tones';

export function TogetherBlock({ rect, lane }: IntervalInput) {
  const id = lane.id;
  return (
    <View
      pointerEvents="none"
      testID={`attendance-together-${id}`}
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: rect.z,
      }}
      className={`${TOGETHER_FILL} border-x-2 border-attendance-together`}
    />
  );
}
