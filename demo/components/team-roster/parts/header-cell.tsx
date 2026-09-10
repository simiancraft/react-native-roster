import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { RosterTick } from 'react-native-roster';
import type { Density } from '../team-roster.types';
import { compactTimeLabel, conciseDate, dayLabel } from '../utils/format';

const DAY_LABEL: Record<Density, (time: number, timezone: string) => string> = {
  full: dayLabel,
  compact: conciseDate,
  avatar: conciseDate,
};

type HeaderCellInput = { tick: RosterTick; timezone: string; density: Density };

/** One header cell per tick kind: a small hour label, or a day boundary with its date. */
const CELLS: Record<RosterTick['kind'], (input: HeaderCellInput) => ReactNode> = {
  time: ({ tick, timezone }) => (
    <View className="h-10 justify-end pb-1 pl-1 border-l border-grid">
      <Text numberOfLines={1} className="text-[10px] tabular-nums text-muted-foreground">
        {compactTimeLabel(tick.time, timezone)}
      </Text>
    </View>
  ),
  day: ({ tick, timezone, density }) => (
    <View className="h-10 justify-start pt-1.5 pl-2 border-l-2 border-grid-strong">
      <Text numberOfLines={1} className="text-xs font-semibold text-foreground">
        {DAY_LABEL[density](tick.time, timezone)}
      </Text>
    </View>
  ),
};

export function DayHeaderCell(input: HeaderCellInput) {
  return CELLS[input.tick.kind](input);
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
