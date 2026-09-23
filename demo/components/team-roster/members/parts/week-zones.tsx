import { createContext, useContext } from 'react';
import { Pressable, Text, View } from 'react-native';
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

export const WeekFocusDate = createContext<{
  focusDate: string;
  selectDate: (localDate: string) => void;
} | null>(null);

export function WeekDayHeader({ day }: { day: DayColumn }) {
  const context = useContext(WeekFocusDate);
  if (!context) throw new Error('WeekDayHeader requires the inspector week');
  const selected = context.focusDate === day.localDate;
  const className = selected ? 'items-center py-1 bg-background' : 'items-center py-1';
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${day.localDate}T00:00:00Z`));
  return (
    <Pressable
      className={className}
      accessibilityRole="button"
      accessibilityLabel={`Show ${label}`}
      accessibilityState={{ selected }}
      onPress={() => context.selectDate(day.localDate)}
    >
      <Text className="text-[10px] font-medium text-foreground">{day.label.slice(0, 3)}</Text>
      <Text className="text-[9px] text-muted-foreground">{day.localDate.slice(8)}</Text>
    </Pressable>
  );
}
