import type { ComponentType } from 'react';
import { Roster, RosterSelectionPopover, type SelectionLayoutProps } from 'react-native-roster';
import type { Attendance } from './attendance.types';
import { AttendanceLayout } from './layout';
import { AttendeeLabel } from './parts/attendee-label';
import { AttendanceGridLines } from './parts/grid-lines';
import { AttendanceHeaderCell } from './parts/header-cell';
import { AttendanceInterval } from './parts/interval';
import { AttendanceIntervalDetail } from './parts/interval-detail';
import { AttendanceLegend } from './parts/legend';
import { AttendanceModeToggle } from './parts/mode-toggle';
import { AttendanceApartNotice, AttendanceTogetherNotice } from './parts/notice';
import { AttendanceTitle } from './parts/title';
import { useAttendance } from './use-attendance';

export function AttendancePanel({
  attendance,
  selectionLayout: SelectionLayout = RosterSelectionPopover,
}: {
  attendance: Attendance;
  /** Presentation for selected layers; defaults to the public popover. */
  selectionLayout?: ComponentType<SelectionLayoutProps>;
}) {
  const model = useAttendance(attendance);
  const zones = {
    titleZone: <AttendanceTitle attendance={attendance} />,
    controlsZone: (
      <AttendanceModeToggle
        attendees={attendance.attendees}
        mode={model.mode}
        onChange={model.chooseMode}
      />
    ),
    rosterZone: (
      <Roster
        lanes={model.lanes}
        windowSpec={model.windowSpec}
        rowHeight={model.rowHeight}
        minuteStep={model.minuteStep}
        pxPerMinute={model.pxPerMinute}
        gridComponent={AttendanceGridLines}
        headerCellComponent={AttendanceHeaderCell}
        laneLabelWidth={108}
        intervalComponent={AttendanceInterval}
        laneLabelComponent={AttendeeLabel}
        intervalDetailComponent={AttendanceIntervalDetail}
        selectionLayout={SelectionLayout}
        style={{ height: Math.max(136, model.lanes.length * model.rowHeight + 42) }}
        className="rounded-lg border border-border bg-background"
        headerClassName="border-b border-border bg-card"
        laneLabelColumnClassName="bg-card border-r border-border"
        bodyClassName="bg-background"
      />
    ),
    legendZone: <AttendanceLegend />,
  };
  if (model.status === 'apart')
    return <AttendanceLayout {...zones} noticeZone={<AttendanceApartNotice />} />;
  return (
    <AttendanceLayout
      {...zones}
      noticeZone={
        <AttendanceTogetherNotice
          together={model.together}
          plan={attendance.plan}
          timezone={attendance.timezone}
        />
      }
    />
  );
}
