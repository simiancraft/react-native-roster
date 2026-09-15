import { Text, View } from 'react-native';
import type { ScheduleHoursInput } from 'react-native-roster';
import type { DayColumn } from 'react-native-roster/core';

export function WeekGutter({ hours, pxPerHour }: ScheduleHoursInput) {
  return (
    <View>
      {hours.map((hour) => (
        <View key={hour} style={{ height: pxPerHour }} className="items-end pr-1">
          <Text className="text-[9px] text-muted-foreground">{String(hour).padStart(2, '0')}</Text>
        </View>
      ))}
    </View>
  );
}

export function WeekGrid({ hours, pxPerHour }: ScheduleHoursInput) {
  return (
    <View pointerEvents="none" className="absolute w-full">
      {hours.map((hour) => (
        <View key={hour} style={{ height: pxPerHour }} className="border-t border-r border-grid" />
      ))}
    </View>
  );
}

export function WeekDayHeader({ day }: { day: DayColumn }) {
  return (
    <View className="items-center py-1">
      <Text className="text-[10px] font-medium text-foreground">{day.label.slice(0, 3)}</Text>
      <Text className="text-[9px] text-muted-foreground">{day.localDate.slice(8)}</Text>
    </View>
  );
}

/** Schedule has no controlled clock; omit its system-clock line in the seeded showcase. */
export function WeekNowLine() {
  return null;
}
