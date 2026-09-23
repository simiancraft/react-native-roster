import { createContext, useContext } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ScheduleDayHeaderInput, ScheduleHoursInput } from 'react-native-roster';
import { ToolbarButton } from '../../parts/chips';
import type { InspectorLink } from '../../team-roster.types';

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
} | null>(null);

export function WeekDayHeader({ day, onPress }: ScheduleDayHeaderInput) {
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
      onPress={onPress}
    >
      <Text className="text-[10px] font-medium text-foreground">{day.label.slice(0, 3)}</Text>
      <Text className="text-[9px] text-muted-foreground">{day.localDate.slice(8)}</Text>
    </Pressable>
  );
}

export function WeekNavigation({
  focusDate,
  link,
  onPrev,
  onNext,
  onLink,
}: {
  focusDate: string;
  link: InspectorLink;
  onPrev: () => void;
  onNext: () => void;
  onLink: () => void;
}) {
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${focusDate}T00:00:00Z`));
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Text className="text-xs text-muted-foreground">
        {link === 'linked' ? `Linked to roster · ${date}` : 'Detached from roster'}
      </Text>
      <ToolbarButton label="‹" accessibilityLabel="Previous inspector week" onPress={onPrev} />
      {link === 'detached' ? (
        <ToolbarButton
          label={`Back to roster · ${date}`}
          accessibilityLabel={`Back to roster at ${date}`}
          onPress={onLink}
        />
      ) : null}
      <ToolbarButton label="›" accessibilityLabel="Next inspector week" onPress={onNext} />
    </View>
  );
}
