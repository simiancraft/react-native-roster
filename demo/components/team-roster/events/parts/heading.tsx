import { Text, View } from 'react-native';
import { timeLabel } from '../../utils/format';
import type { MemberEvent } from '../event.types';

export function EventHeading({ event, timezone }: { event: MemberEvent; timezone: string }) {
  return (
    <View className="gap-1">
      <Text className="font-semibold text-foreground">{event.title}</Text>
      <Text className="text-xs text-muted-foreground">
        {timeLabel(event.start, timezone)} to {timeLabel(event.end, timezone)} · {timezone}
      </Text>
      <Text className="text-xs text-foreground">{event.description}</Text>
    </View>
  );
}
