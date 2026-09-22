import { Schedule } from 'react-native-roster';
import type { Lane } from 'react-native-roster/core';
import { TeamScheduleInterval, TeamTimezone, TimeOffGap } from '../../parts/layer-fillers';
import type { WeekWindowSpec } from '../../team-roster.types';
import { localDateFor } from '../../utils/format';
import { WeekDayHeader, WeekFocusDate, WeekGrid, WeekGutter, WeekNowLine } from './week-zones';

/** The member's week in day columns, styled through class props and zone fillers. */
export function WeekSchedule({
  lane,
  windowSpec,
  focusDate,
  selectDate,
}: {
  lane: Lane;
  windowSpec: WeekWindowSpec;
  focusDate: string;
  selectDate: (localDate: string) => void;
}) {
  return (
    <TeamTimezone.Provider value={windowSpec.timezone}>
      <WeekFocusDate.Provider value={{ focusDate, selectDate }}>
        <Schedule
          lane={lane}
          windowSpec={windowSpec}
          pxPerHour={28}
          onCellPress={(_lane, time) => selectDate(localDateFor(time, windowSpec.timezone))}
          className="flex-1 min-h-0 rounded-lg border border-border bg-background"
          headerClassName="border-b border-border bg-muted/60"
          gutterClassName="bg-muted/60"
          gutterComponent={WeekGutter}
          gridComponent={WeekGrid}
          dayHeaderComponent={WeekDayHeader}
          intervalComponent={TeamScheduleInterval}
          gapComponent={TimeOffGap}
          nowLineComponent={WeekNowLine}
        />
      </WeekFocusDate.Provider>
    </TeamTimezone.Provider>
  );
}
