import { Schedule, type ScheduleWindowSpec } from 'react-native-roster';
import type { Lane } from 'react-native-roster/core';
import { intervalFillerFor, TimeOffGap } from '../../parts/layer-fillers';
import { WeekDayHeader, WeekGrid, WeekGutter, WeekNowLine } from './week-zones';

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
      gutterZone={WeekGutter}
      gridZone={WeekGrid}
      dayHeaderZone={WeekDayHeader}
      intervalZone={intervalFillerFor(windowSpec.timezone)}
      gapZone={TimeOffGap}
      nowLineZone={WeekNowLine}
    />
  );
}
