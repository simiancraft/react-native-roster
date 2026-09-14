import { Text, View } from 'react-native';
import type { LaneLabelInput } from 'react-native-roster';
import { attendanceMeta } from '../utils/attendance';

export function AttendeeLabel({ lane }: LaneLabelInput) {
  const { attendee, minutes } = attendanceMeta(lane);
  return (
    <View className="flex-1 justify-center border-b border-border px-2">
      <Text numberOfLines={1} className="text-xs font-medium text-foreground">
        {attendee.name}
      </Text>
      <Text className="text-[9px] text-muted-foreground">{minutes.together}m together</Text>
      <Text className="text-[9px] text-muted-foreground">{minutes.dead}m dead time</Text>
    </View>
  );
}
