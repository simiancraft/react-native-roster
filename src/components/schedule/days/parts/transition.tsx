import { Text, View } from 'react-native';
import type { ScheduleTransitionInput } from '../../schedule.types';

export function ScheduleTransition({
  transition,
  y,
  dividerY,
  height,
  width,
}: ScheduleTransitionInput) {
  if (height === 0) return null;
  if (transition.deltaMinutes < 0)
    return (
      <View
        testID="schedule-repeat"
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: dividerY,
          width,
          borderTopWidth: 1,
          borderTopColor: '#92400e',
        }}
      >
        <Text
          style={{
            fontSize: 9,
            color: '#92400e',
            backgroundColor: '#fffbeb',
            alignSelf: 'flex-start',
          }}
        >
          again
        </Text>
      </View>
    );
  return (
    <View
      testID="schedule-skip"
      pointerEvents="none"
      accessibilityLabel="Skipped time"
      style={{
        position: 'absolute',
        top: y,
        height,
        width,
        overflow: 'hidden',
        backgroundColor: '#fef3c7',
      }}
    >
      {Array.from({ length: Math.ceil((width + height) / 8) }, (_, index) => {
        const left = index * 8 - height;
        return (
          <View
            key={left}
            style={{
              position: 'absolute',
              left,
              top: -height,
              width: 1,
              height: height * 3,
              backgroundColor: '#d97706',
              transform: [{ rotate: '45deg' }],
            }}
          />
        );
      })}
    </View>
  );
}
