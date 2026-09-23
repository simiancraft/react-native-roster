import { Schedule } from 'react-native-roster';
import type { Lane, Rect, Window } from 'react-native-roster/core';
import { TeamScheduleInterval, TeamTimezone, TimeOffGap } from '../../parts/layer-fillers';
import type { WeekWindowSpec } from '../../team-roster.types';
import { WeekDayHeader, WeekFocusDate, WeekGrid, WeekGutter } from './week-zones';

/** The member's week in day columns, styled through class props and zone fillers. */
export function WeekSchedule({
  now,
  lane,
  windowSpec,
  rosterWindow,
  focusDate,
  selectDate,
  selectCell,
  selectGap,
}: {
  now: number;
  lane: Lane;
  windowSpec: WeekWindowSpec;
  rosterWindow: Window;
  focusDate: string;
  selectDate: (localDate: string) => void;
  selectCell: (time: number) => void;
  selectGap: (rect: Rect) => void;
}) {
  return (
    <TeamTimezone.Provider value={windowSpec.timezone}>
      <WeekFocusDate.Provider value={{ focusDate }}>
        <Schedule
          now={now}
          lane={lane}
          windowSpec={windowSpec}
          bandWindow={rosterWindow}
          pxPerHour={28}
          onDayPress={(day) => selectDate(day.localDate)}
          onCellPress={(_lane, time) => selectCell(time)}
          onGapPress={(rect) => selectGap(rect)}
          className="flex-1 min-h-0 rounded-lg border border-border bg-background"
          headerClassName="border-b border-border bg-muted/60"
          gutterClassName="bg-muted/60"
          gutterComponent={WeekGutter}
          gridComponent={WeekGrid}
          dayHeaderComponent={WeekDayHeader}
          intervalComponent={TeamScheduleInterval}
          gapComponent={TimeOffGap}
        />
      </WeekFocusDate.Provider>
    </TeamTimezone.Provider>
  );
}
