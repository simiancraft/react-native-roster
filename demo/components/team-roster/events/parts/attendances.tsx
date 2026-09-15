import type { ComponentType, ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { Window } from 'react-native-roster/core';
import type { Attendance, MemberEvent, Presence } from '../../members/member.types';
import { barOffsets } from '../../utils/attendance';
import { offsetLabel, timeLabel } from '../../utils/format';
import { KIND_CLASSES } from '../../utils/tones';

type RowInput<S extends Presence['state'] = Presence['state']> = {
  attendance: Extract<Attendance, { state: S }>;
  event: MemberEvent;
  scale: Window;
  timezone: string;
};

export function ExpectedRow(input: RowInput<'expected'>) {
  return <AttendanceRow {...input} caption="scheduled" />;
}
export function PendingRow(input: RowInput<'pending'>) {
  return <AttendanceRow {...input} caption="not yet arrived" />;
}
export function AbsentRow(input: RowInput<'absent'>) {
  return <AttendanceRow {...input} caption="no-show" />;
}
export function PresentRow(input: RowInput<'present'>) {
  return (
    <AttendanceRow
      {...input}
      caption={`arrived ${offsetLabel(input.attendance.arrival, input.event.start)}, still here`}
      barZone={
        <ActualBar
          event={input.event}
          scale={input.scale}
          actual={{ start: input.attendance.arrival, end: input.event.now }}
        />
      }
    />
  );
}
export function AttendedRow(input: RowInput<'attended'>) {
  const { attendance, event, timezone } = input;
  return (
    <AttendanceRow
      {...input}
      caption={`${timeLabel(attendance.start, timezone)} to ${timeLabel(attendance.end, timezone)} · arrival ${offsetLabel(attendance.start, event.start)} · departure ${offsetLabel(attendance.end, event.end)}`}
      barZone={<ActualBar event={event} scale={input.scale} actual={attendance} />}
    />
  );
}

const ROWS = {
  expected: ExpectedRow,
  pending: PendingRow,
  present: PresentRow,
  attended: AttendedRow,
  absent: AbsentRow,
} satisfies { [S in Presence['state']]: ComponentType<RowInput<S>> };

export function Attendances(input: Omit<RowInput, 'attendance'>) {
  return input.event.attendances.map((attendance) => {
    const Row = ROWS[attendance.state] as ComponentType<RowInput>;
    return <Row key={attendance.attendeeId} {...input} attendance={attendance} />;
  });
}

function AttendanceRow({
  attendance,
  event,
  scale,
  caption,
  barZone,
}: RowInput & {
  caption: string;
  /** The recorded presence span within the scheduled outline. */
  barZone?: ReactNode;
}) {
  const scheduled = barOffsets(event, scale);
  const attendee = event.expected.find((person) => person.id === attendance.attendeeId);
  return (
    <View testID={`attendance-row-${attendance.attendeeId}`} className="gap-1">
      <Text className="text-xs font-medium text-foreground">{attendee?.name}</Text>
      <Text className="text-[10px] text-muted-foreground">{caption}</Text>
      <View className="relative h-5">
        <View
          testID="attendance-scheduled"
          className="absolute top-0 bottom-0 rounded-sm border border-foreground/60"
          style={{ left: `${scheduled.left}%`, width: `${scheduled.width}%` }}
        />
        {barZone}
      </View>
    </View>
  );
}

function ActualBar({
  event,
  scale,
  actual,
}: {
  event: MemberEvent;
  scale: Window;
  actual: Window;
}) {
  const bar = barOffsets(actual, scale);
  return (
    <View
      testID="attendance-actual"
      className={`absolute top-1 h-3 rounded-sm ${KIND_CLASSES[event.kind].dot}`}
      style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
    />
  );
}
