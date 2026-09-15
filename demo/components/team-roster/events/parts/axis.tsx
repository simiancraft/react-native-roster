import { Text, View } from 'react-native';
import type { Window } from 'react-native-roster/core';
import { timeLabel } from '../../utils/format';

export function EventAxis({ scale, timezone }: { scale: Window; timezone: string }) {
  return (
    <View className="h-4 flex-row justify-between">
      <Text className="text-[10px] text-muted-foreground">{timeLabel(scale.start, timezone)}</Text>
      <Text className="text-[10px] text-muted-foreground">{timeLabel(scale.end, timezone)}</Text>
    </View>
  );
}
