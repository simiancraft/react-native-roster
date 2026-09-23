import { Text } from 'react-native';
import { Card } from '../../../ui/card';
import type { Selection } from '../../team-roster.types';
import { dayLabel, timeLabel } from '../../utils/format';

type Of<K extends Selection['kind']> = Extract<Selection, { kind: K }>;

export function TimeOffSelection({ selection }: { selection: Of<'timeOff'> }) {
  return (
    <Card
      tone="dashed"
      className="gap-1 rounded-lg p-3"
      contentZone={
        <>
          <Text className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Time off
          </Text>
          <Text className="text-sm font-medium text-foreground">{selection.note}</Text>
        </>
      }
    />
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
    <Card
      tone="inset"
      className="gap-1 rounded-lg p-3"
      contentZone={
        <>
          <Text className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Open slot
          </Text>
          <Text className="text-sm font-medium text-foreground">
            {dayLabel(selection.time, timezone)} · {timeLabel(selection.time, timezone)}
          </Text>
          <Text className="text-xs text-muted-foreground">Snapped to the hour.</Text>
        </>
      }
    />
  );
}

export function NoSelection() {
  return (
    <Card
      tone="inset"
      className="rounded-lg p-3"
      contentZone={
        <Text className="text-xs text-muted-foreground">
          Press an open slot, or time off to inspect it.
        </Text>
      }
    />
  );
}
