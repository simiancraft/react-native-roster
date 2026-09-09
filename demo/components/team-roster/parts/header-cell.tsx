import { Text, View } from 'react-native';
import type { RosterTick } from 'react-native-roster';
import type { Density } from '../team-roster.types';
import { compactTimeLabel, conciseDate, dayLabel } from '../utils/format';

const DAY_LABEL: Record<Density, (time: number, timezone: string) => string> = {
  full: dayLabel,
  compact: conciseDate,
  avatar: conciseDate,
};

export function DayHeaderCell({
  tick,
  timezone,
  density,
}: {
  tick: RosterTick;
  timezone: string;
  density: Density;
}) {
  if (tick.kind === 'time')
    return (
      <View className="h-10 justify-end pb-1 pl-1 border-l border-grid">
        <Text numberOfLines={1} className="text-[10px] tabular-nums text-muted-foreground">
          {compactTimeLabel(tick.time, timezone)}
        </Text>
      </View>
    );
  return (
    <View className="h-10 justify-start pt-1.5 pl-2 border-l-2 border-grid-strong">
      <Text numberOfLines={1} className="text-xs font-semibold text-foreground">
        {DAY_LABEL[density](tick.time, timezone)}
      </Text>
    </View>
  );
}

const CORNER: Record<Density, (label: string, count: number) => string> = {
  full: (label, count) => `${label} · ${count}`,
  compact: (label, count) => `${label} · ${count}`,
  avatar: (_label, count) => String(count),
};

/** The cell above the people column: the group being viewed and how many are shown. */
export function TeamCorner({
  label,
  count,
  density,
}: {
  label: string;
  count: number;
  density: Density;
}) {
  return (
    <View className="h-10 justify-center px-3">
      <Text
        numberOfLines={1}
        className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
      >
        {CORNER[density](label, count)}
      </Text>
    </View>
  );
}
