import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { Window } from 'react-native-roster/core';
import { timeLabel } from '../../utils/format';

export function FutureCaption() {
  return <Text className="text-[10px] text-muted-foreground">Scheduled · expected attendees</Text>;
}
export function LiveCaption() {
  return (
    <Text className="text-[10px] text-muted-foreground">
      Live attendance · outline marks scheduled time
    </Text>
  );
}
export function PastCaption() {
  return (
    <Text className="text-[10px] text-muted-foreground">
      Actual attendance · outline marks scheduled time
    </Text>
  );
}
export function EventAxis({
  scale,
  timezone,
  captionZone,
}: {
  scale: Window;
  timezone: string;
  /** Reading key for the event's time state. */
  captionZone: ReactNode;
}) {
  return (
    <View className="gap-1">
      {captionZone}
      <View className="flex-row justify-between border-b border-border">
        <Text className="text-[10px] text-muted-foreground">
          {timeLabel(scale.start, timezone)}
        </Text>
        <Text className="text-[10px] text-muted-foreground">{timeLabel(scale.end, timezone)}</Text>
      </View>
    </View>
  );
}
