import { Text, View } from 'react-native';
import { Schedule, type ScheduleWindowSpec } from 'react-native-roster';
import type { Lane } from 'react-native-roster/core';
import { intervalFillerFor, TimeOffGap } from '../../parts/interval';

/** The member's week in day columns, styled through class props and zone fillers. */
export function WeekSchedule({ lane, windowSpec }: { lane: Lane; windowSpec: ScheduleWindowSpec }) {
  return (
    <Schedule
      lane={lane}
      windowSpec={{ ...windowSpec, span: 'week' }}
      pxPerHour={28}
      className="flex-1 min-h-0 rounded-lg border border-border bg-background"
      headerClassName="border-b border-border bg-muted/60"
      gutterClassName="bg-muted/60"
      gutterZone={({ hours, pxPerHour }) => (
        <View>
          {hours.map((hour) => (
            <View key={hour} style={{ height: pxPerHour }} className="items-end pr-1">
              <Text className="text-[9px] text-muted-foreground">
                {String(hour).padStart(2, '0')}
              </Text>
            </View>
          ))}
        </View>
      )}
      gridZone={({ hours, pxPerHour }) => (
        <View pointerEvents="none" className="absolute w-full">
          {hours.map((hour) => (
            <View
              key={hour}
              style={{ height: pxPerHour }}
              className="border-t border-r border-grid"
            />
          ))}
        </View>
      )}
      dayHeaderZone={({ day }) => (
        <View className="items-center py-1">
          <Text className="text-[10px] font-medium text-foreground">{day.label.slice(0, 3)}</Text>
          <Text className="text-[9px] text-muted-foreground">{day.localDate.slice(8)}</Text>
        </View>
      )}
      intervalZone={intervalFillerFor(windowSpec.timezone)}
      gapZone={TimeOffGap}
      nowLineZone={({ y }) => (
        <View
          pointerEvents="none"
          style={{ top: y }}
          className="absolute left-0 right-0 h-0.5 bg-rose-500"
        />
      )}
    />
  );
}
