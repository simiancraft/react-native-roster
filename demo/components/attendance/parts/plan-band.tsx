import { View } from 'react-native';
import type { IntervalInput } from 'react-native-roster';
import { attendanceMeta } from '../utils/attendance';
import { KIND_COLORS } from '../utils/tones';

export function PlanBand({ rect, lane }: IntervalInput) {
  const color = KIND_COLORS[attendanceMeta(lane).attendance.kind];
  return (
    <View
      pointerEvents="none"
      testID={`attendance-plan-${lane.id}`}
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: rect.z,
      }}
      className={`${color.fill} opacity-20`}
    />
  );
}
