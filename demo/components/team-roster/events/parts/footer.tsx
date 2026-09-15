import { Text } from 'react-native';
import type { AttendanceModel, AttendanceRowModel } from '../utils/attendance';

export function EventFooter({
  status,
  row,
}: Pick<AttendanceModel, 'status'> & { row: AttendanceRowModel | undefined }) {
  const subject = status === 'future' ? 'Expected attendees' : 'Actual attendance';
  const text = row
    ? `${row.attendee.name} · ${row.detail}`
    : `${subject}; the shaded band is the scheduled window`;
  return (
    <Text testID="attendance-status" className="text-[10px] text-muted-foreground">
      {text}
    </Text>
  );
}
