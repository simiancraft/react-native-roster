import { Text } from 'react-native';
import type { AttendanceModel, AttendanceRowModel } from '../utils/attendance';

const SUBJECT: Record<AttendanceModel['status'], string> = {
  future: 'Expected attendees',
  live: 'Actual attendance',
  past: 'Actual attendance',
};

export function AttendanceLegend({ status }: Pick<AttendanceModel, 'status'>) {
  return (
    <Text testID="attendance-status" className="text-[10px] text-muted-foreground">
      {`${SUBJECT[status]}; the shaded band is the scheduled window`}
    </Text>
  );
}

export function ActiveAttendance({ row }: { row: AttendanceRowModel }) {
  return (
    <Text testID="attendance-status" className="text-[10px] text-muted-foreground">
      {`${row.attendee.name} · ${row.detail}`}
    </Text>
  );
}
