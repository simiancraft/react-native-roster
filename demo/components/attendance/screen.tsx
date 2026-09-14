import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { Attendance } from './attendance.types';
import { AttendancePanel } from './index';
import { dateLabel } from './utils/format';

export function AttendanceScreen({
  attendances,
  homeZone,
}: {
  attendances: Attendance[];
  /** Home navigation supplied by the route shell. */
  homeZone: ReactNode;
}) {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 gap-5">
      {homeZone}
      <Text accessibilityRole="header" className="text-3xl font-semibold text-foreground">
        Planned time, real attendance
      </Text>
      <Text className="text-sm text-muted-foreground">
        Lantern Foundry, a fictional studio. Each panel has its own definition of together.
      </Text>
      <View className="flex-col gap-4 xl:flex-row">
        {attendances.map((attendance) => (
          <View key={attendance.id} className="min-w-0 flex-1">
            <Text className="mb-2 text-xs text-muted-foreground">
              {dateLabel(attendance.plan.start, attendance.timezone)}
            </Text>
            <AttendancePanel attendance={attendance} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
