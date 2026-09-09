import { Text, View } from 'react-native';
import type { Selection } from '../../team-roster.types';
import { dayLabel, durationLabel, timeLabel } from '../../utils/format';
import { eventKindOf, KIND_CLASSES } from '../../utils/tones';

type Of<K extends Selection['kind']> = Extract<Selection, { kind: K }>;

export function EventSelection({
  selection,
  timezone,
}: {
  selection: Of<'event'>;
  timezone: string;
}) {
  const { event } = selection;
  const kind = KIND_CLASSES[eventKindOf(event.kind)];
  return (
    <View className="gap-1 rounded-lg border border-border bg-background p-3">
      <View className="flex-row items-center gap-2">
        <View className={`h-2 w-2 rounded-full ${kind.dot}`} />
        <Text className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {kind.label}
        </Text>
      </View>
      <Text className="text-sm font-medium text-foreground">{event.title}</Text>
      <Text className="text-xs text-muted-foreground">
        {dayLabel(event.start, timezone)} · {timeLabel(event.start, timezone)} to{' '}
        {timeLabel(event.end, timezone)} · {durationLabel(event.start, event.end)}
      </Text>
    </View>
  );
}

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
