import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { KIND_CLASSES } from '../../utils/tones';
import type { AttendanceModel, AttendanceRowModel } from '../utils/attendance';
import { attendanceInteraction } from './attendance-interaction';
import type { AttendanceInteractionInput } from './attendance-interaction.types';
import { EventAxis } from './axis';
import type { useActiveAttendance } from './use-active-attendance';

export function Attendances({
  model,
  timezone,
  active,
}: {
  model: AttendanceModel;
  timezone: string;
  active: ReturnType<typeof useActiveAttendance>;
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
            onActivate={(interaction) => active.show(row.attendee.id, interaction)}
            onDeactivate={(interaction) => active.hide(row.attendee.id, interaction)}
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
} & AttendanceInteractionInput) {
  let barZone: ReactNode = (
    <View testID="attendance-empty" className="absolute top-1 left-0 right-0 h-px bg-border" />
  );
  if (row.bar)
    barZone = (
      <View
        testID="attendance-actual"
        className={`absolute top-0 h-[10px] rounded-sm ${tone}`}
        style={{ left: `${row.bar.left}%`, width: `${row.bar.width}%` }}
      />
    );
  const glyphClass = row.attendance.state === 'present' ? 'text-primary' : 'text-muted-foreground';
  return (
    <View testID={`attendance-row-${row.attendee.id}`}>
      <Text numberOfLines={1} className="text-[10px] leading-3 text-muted-foreground">
        {row.attendee.name}{' '}
        <Text accessibilityLabel={row.attendance.state} className={glyphClass}>
          {row.glyph}
        </Text>
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${row.attendee.name}: ${row.detail}`}
        className="relative h-[10px]"
        {...attendanceInteraction({ onActivate, onDeactivate })}
        onPress={(event) => event.stopPropagation()}
      >
        {barZone}
      </Pressable>
    </View>
  );
}
