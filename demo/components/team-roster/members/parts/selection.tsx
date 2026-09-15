import { Text, View } from 'react-native';
import type { Selection } from '../../team-roster.types';
import { dayLabel, timeLabel } from '../../utils/format';

type Of<K extends Selection['kind']> = Extract<Selection, { kind: K }>;

export function TimeOffSelection({ selection }: { selection: Of<'timeOff'> }) {
  return (
    <View className="gap-1 rounded-lg border border-dashed border-grid-strong bg-background p-3">
      <Text className="text-[10px] uppercase tracking-wide text-muted-foreground">Time off</Text>
      <Text className="text-sm font-medium text-foreground">{selection.note}</Text>
    </View>
  );
}

export function SlotSelection({
  selection,
  timezone,
}: {
  selection: Of<'slot'>;
  timezone: string;
}) {
  return (
    <View className="gap-1 rounded-lg border border-border bg-background p-3">
      <Text className="text-[10px] uppercase tracking-wide text-muted-foreground">Open slot</Text>
      <Text className="text-sm font-medium text-foreground">
        {dayLabel(selection.time, timezone)} · {timeLabel(selection.time, timezone)}
      </Text>
      <Text className="text-xs text-muted-foreground">Snapped to the hour.</Text>
    </View>
  );
}

export function NoSelection() {
  return (
    <View className="rounded-lg border border-border bg-background p-3">
      <Text className="text-xs text-muted-foreground">
        Press an event or an open slot in the roster.
      </Text>
    </View>
  );
}
