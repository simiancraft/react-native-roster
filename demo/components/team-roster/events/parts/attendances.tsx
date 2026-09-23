import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { cn } from '../../../ui/utils/classes';
import { KIND_CLASSES } from '../../utils/tones';
import type { AttendanceModel, AttendanceRowModel } from '../utils/attendance';
import { attendanceInteraction } from './attendance-interaction';
import type {
  AttendanceInteractionInput,
  AttendanceInteractionKind,
} from './attendance-interaction.types';
import { EventAxis } from './axis';

const EMPHASIS_CLASSES: Record<AttendanceRowModel['emphasis'], string> = {
  primary: 'text-primary',
  muted: 'text-muted-foreground',
};

export function Attendances({
  model,
  timezone,
  onActivate,
  onDeactivate,
}: {
  model: AttendanceModel;
  timezone: string;
  onActivate: (attendeeId: string, interaction: AttendanceInteractionKind) => void;
  onDeactivate: (attendeeId: string, interaction: AttendanceInteractionKind) => void;
}) {
  return (
    <View className="relative">
      <View pointerEvents="none" className="absolute inset-0">
        {model.ticks.map((tick) => (
          <View
            key={tick.time}
            testID="attendance-tick"
            className="absolute top-0 bottom-0 border-l border-border/40"
            style={{ left: `${tick.left}%` }}
          />
        ))}
        <View
          testID="attendance-scheduled"
          className="absolute top-4 bottom-0 bg-foreground/10"
          style={{ left: `${model.band.left}%`, width: `${model.band.width}%` }}
        />
      </View>
      <EventAxis scale={model.scale} timezone={timezone} />
      <View className="gap-1">
        {model.rows.map((row) => (
          <AttendanceRow
            key={row.attendee.id}
            row={row}
            tone={KIND_CLASSES[model.event.kind].dot}
            onActivate={(interaction) => onActivate(row.attendee.id, interaction)}
            onDeactivate={(interaction) => onDeactivate(row.attendee.id, interaction)}
          />
        ))}
      </View>
    </View>
  );
}

function AttendanceRow({
  row,
  tone,
  onActivate,
  onDeactivate,
}: {
  row: AttendanceRowModel;
  tone: string;
} & Omit<AttendanceInteractionInput, 'accessibilityLabel'>) {
  let barZone: ReactNode = (
    <View testID="attendance-empty" className="absolute top-1 left-0 right-0 h-px bg-border" />
  );
  if (row.bar)
    barZone = (
      <View
        testID="attendance-actual"
        className={cn('absolute top-0 h-[10px] rounded-sm', tone)}
        style={{ left: `${row.bar.left}%`, width: `${row.bar.width}%` }}
      />
    );
  return (
    <View testID={`attendance-row-${row.attendee.id}`}>
      <Text numberOfLines={1} className="text-[10px] leading-3 text-muted-foreground">
        {row.attendee.name}{' '}
        <Text accessibilityLabel={row.attendance.state} className={EMPHASIS_CLASSES[row.emphasis]}>
          {row.glyph}
        </Text>
      </Text>
      <Pressable
        className="relative h-[10px]"
        {...attendanceInteraction({
          accessibilityLabel: `${row.attendee.name}: ${row.detail}`,
          onActivate,
          onDeactivate,
        })}
      >
        {barZone}
      </Pressable>
    </View>
  );
}
