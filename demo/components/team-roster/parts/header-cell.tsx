import type { ComponentType } from 'react';
import { Text, View } from 'react-native';
import { type RosterTick, windowFor } from 'react-native-roster';
import type { Density, SpanKey } from '../team-roster.types';
import { compactTimeLabel, conciseDate, dayLabel, localDateFor } from '../utils/format';

const HOUR = 60 * 60_000;

const DAY_LABEL: Record<Density, (time: number, timezone: string) => string> = {
  full: dayLabel,
  compact: conciseDate,
  avatar: conciseDate,
};

type HeaderCellInput = {
  tick: RosterTick;
  timezone: string;
  density: Density;
  span: SpanKey;
};

/** One header cell per tick kind: a time with week date context, or a dated day boundary. */
const CELLS: Record<RosterTick['kind'], ComponentType<HeaderCellInput>> = {
  time: function TimeCell({ tick, timezone, span }) {
    const time = compactTimeLabel(tick.time, timezone);
    const localDate = localDateFor(tick.time, timezone);
    const dayStart = windowFor({ span: 'day', anchorDate: localDate, timezone }).start;
    const showDate = span === 'week' && tick.time !== dayStart + HOUR;
    return (
      <View className="h-10 justify-end gap-0.5 pb-1 pl-1 border-l border-grid">
        {showDate ? (
          <Text numberOfLines={1} className="text-[9px] leading-none text-muted-foreground">
            {conciseDate(tick.time, timezone)}
          </Text>
        ) : null}
        <Text numberOfLines={1} className="text-[10px] tabular-nums text-muted-foreground">
          {time}
        </Text>
      </View>
    );
  },
  day: function DayCell({ tick, timezone, density }) {
    return (
      <View className="h-10 justify-start pt-1.5 pl-2 border-l-2 border-grid-strong">
        <Text numberOfLines={1} className="text-xs font-semibold text-foreground">
          {DAY_LABEL[density](tick.time, timezone)}
        </Text>
      </View>
    );
  },
};

export function DayHeaderCell(input: HeaderCellInput) {
  const Cell = CELLS[input.tick.kind];
  return <Cell {...input} />;
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
