import { Text, View } from 'react-native';
import type { RosterTick } from 'react-native-roster';
import { compactTimeLabel, dayLabel } from '../utils/format';

export function DayHeaderCell({ tick, timezone }: { tick: RosterTick; timezone: string }) {
  if (tick.kind === 'time')
    return (
      <View className="h-10 justify-end pb-1 pl-1 border-l border-zinc-800">
        <Text numberOfLines={1} className="text-[10px] tabular-nums text-zinc-500">
          {compactTimeLabel(tick.time, timezone)}
        </Text>
      </View>
    );
  return (
    <View className="h-10 justify-start pt-1.5 pl-2 border-l-2 border-zinc-600">
      <Text numberOfLines={1} className="text-xs font-semibold text-zinc-100">
        {dayLabel(tick.time, timezone)}
      </Text>
    </View>
  );
}

export function TeamCorner({ count }: { count: number }) {
  return (
    <View className="h-10 justify-center px-3">
      <Text className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        Team · {count}
      </Text>
    </View>
  );
}
