import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import type { ScheduleStyleProps } from './schedule.types';

type ScheduleLayoutProps = Pick<ScheduleStyleProps, 'headerStyle' | 'gutterStyle' | 'daysStyle'> & {
  /** Frozen day headings, including markers for wholly skipped local dates. */
  dayHeaderZone: ReactNode;
  /** Hour labels in a 48 px left gutter; shares the body's vertical scroll. */
  gutterZone: ReactNode;
  /** Day columns, each containing its grid, rects, transitions, and current-time line. */
  daysZone: ReactNode;
  /** Completeness notice in reserved empty space above the grid. */
  incompleteZone: ReactNode;
};

export function ScheduleLayout({
  dayHeaderZone,
  gutterZone,
  daysZone,
  incompleteZone,
  headerStyle,
  gutterStyle,
  daysStyle,
}: ScheduleLayoutProps) {
  return (
    <View style={{ flex: 1, minHeight: 0 }}>
      <View style={[{ marginLeft: 48, flexDirection: 'row' }, headerStyle]}>{dayHeaderZone}</View>
      <View>{incompleteZone}</View>
      <ScrollView testID="schedule-vertical-scroll" horizontal={false} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={[{ width: 48 }, gutterStyle]}>{gutterZone}</View>
          <View style={[{ flex: 1, minWidth: 0, flexDirection: 'row' }, daysStyle]}>
            {daysZone}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
