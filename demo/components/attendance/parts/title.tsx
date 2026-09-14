import { Text, View } from 'react-native';
import type { Attendance } from '../attendance.types';
import { clockLabel } from '../utils/format';
import { KIND_COLORS } from '../utils/tones';

export function AttendanceTitle({ attendance }: { attendance: Attendance }) {
  return (
    <View className="gap-1">
      <Text className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {KIND_COLORS[attendance.kind].label}
      </Text>
      <Text accessibilityRole="header" className="text-lg font-semibold text-foreground">
        {attendance.title}
      </Text>
      <Text className="text-xs text-muted-foreground">{attendance.description}</Text>
      <Text className="text-xs text-foreground">
        Plan {clockLabel(attendance.plan.start, attendance.timezone)} to{' '}
        {clockLabel(attendance.plan.end, attendance.timezone)} · {attendance.timezone}
      </Text>
    </View>
  );
}
