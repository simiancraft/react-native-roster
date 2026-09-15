import { Text } from 'react-native';
import type { AttendanceModel } from '../utils/attendance';

export function EventFooter({ status }: Pick<AttendanceModel, 'status'>) {
  const subject = status === 'future' ? 'Expected attendees' : 'Actual attendance';
  return (
    <Text className="text-[10px] text-muted-foreground">
      {subject}; the shaded band is the scheduled window
    </Text>
  );
}
