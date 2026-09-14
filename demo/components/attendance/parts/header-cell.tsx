import { Text } from 'react-native';
import type { RosterTick } from 'react-native-roster';

/** The route already names the date; only clock ticks fill this short custom window. */
export function AttendanceHeaderCell({ tick }: { tick: RosterTick }) {
  if (tick.kind === 'day') return null;
  return (
    <Text className="pt-3 pl-1 text-[10px] tabular-nums text-muted-foreground">{tick.label}</Text>
  );
}
