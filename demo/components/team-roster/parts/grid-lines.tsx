import { View } from 'react-native';
import type { GridInput, RosterTick } from 'react-native-roster';

const TICK_LINE: Record<RosterTick['kind'], string> = {
  day: 'absolute top-0 bottom-0 w-px bg-grid-strong',
  time: 'absolute top-0 bottom-0 w-px bg-grid',
};

/** One vertical hairline per tick; day boundaries draw stronger. */
export function TeamGridLines({ ticks, contentWidth }: GridInput) {
  return (
    <View pointerEvents="none" style={{ width: contentWidth }} className="absolute h-full">
      {ticks.map((tick) => (
        <View key={tick.time} style={{ left: tick.x }} className={TICK_LINE[tick.kind]} />
      ))}
    </View>
  );
}
