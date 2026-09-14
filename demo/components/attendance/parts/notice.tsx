import { Text } from 'react-native';
import type { Window } from 'react-native-roster/core';
import { clockLabel, offsetLabel } from '../utils/format';

export function AttendanceApartNotice() {
  return (
    <Text accessibilityRole="alert" className="text-sm text-muted-foreground">
      No time together. Every minute present is dead time.
    </Text>
  );
}
export function AttendanceTogetherNotice({
  together,
  plan,
  timezone,
}: {
  together: Window;
  plan: Window;
  timezone: string;
}) {
  return (
    <Text className="text-sm text-foreground">
      {(together.end - together.start) / 60_000} min together ·{' '}
      {clockLabel(together.start, timezone)} to {clockLabel(together.end, timezone)} · start{' '}
      {offsetLabel(together.start, plan.start)}
    </Text>
  );
}
