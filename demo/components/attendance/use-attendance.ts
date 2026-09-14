import { useState } from 'react';
import { useRoster } from 'react-native-roster';
import type { Lane, WindowSpec } from 'react-native-roster/core';
import type { Attendance, AttendanceMeta, AttendanceMode } from './attendance.types';
import { attendanceMinutes } from './utils/attendance';
import { ATTENDANCE_LAYER, layer } from './utils/layer';
import { collapse, togetherFor } from './utils/overlap';
import { statusFor } from './utils/status';

export function useAttendance(attendance: Attendance) {
  const [mode, chooseMode] = useState<AttendanceMode>({ kind: 'everyone' });
  const together = togetherFor(attendance.attendees, mode);
  const segments = attendance.attendees.flatMap((attendee) => attendee.presence);
  const rowHeight = 48;
  const pxPerMinute = 1.5;
  const minuteStep = 30;
  const version = `${attendance.id}:${mode.kind === 'anchor' ? `anchor:${mode.attendeeId}` : 'everyone'}`;
  const windowSpec: WindowSpec = {
    span: 'custom',
    timezone: attendance.timezone,
    window: {
      start: Math.min(attendance.plan.start, ...segments.map((span) => span.start)) - 10 * 60_000,
      end: Math.max(attendance.plan.end, ...segments.map((span) => span.end)) + 25 * 60_000,
    },
  };
  const baseLanes: Lane[] = attendance.attendees.map((attendee) => {
    const presence = collapse(attendee.presence);
    const layers = [layer(ATTENDANCE_LAYER.plan, 'custom', 0, attendance.plan, 0)];
    if (presence) layers.push(layer(ATTENDANCE_LAYER.presence, 'availability', 1, presence, 8));
    if (together) layers.push(layer(ATTENDANCE_LAYER.together, 'booking', 2, together, 0));
    return {
      id: `${attendance.id}:${attendee.id}`,
      version,
      label: attendee.name,
      layers,
    };
  });
  const roster = useRoster({
    lanes: baseLanes,
    windowSpec,
    rowHeight,
    pxPerMinute,
    minuteStep,
  });
  const lanes = baseLanes.map((lane, index) => {
    const attendee = attendance.attendees[index];
    const coverage = roster.coverage.get(lane.id);
    if (!attendee || !coverage) throw new Error('Attendance coverage requires every attendee');
    return {
      ...lane,
      meta: {
        attendance,
        attendee,
        presence: collapse(attendee.presence),
        together,
        status: statusFor(collapse(attendee.presence), attendance.plan, together),
        minutes: attendanceMinutes(coverage),
      } satisfies AttendanceMeta,
    };
  });
  const common = { lanes, windowSpec, mode, chooseMode, rowHeight, pxPerMinute, minuteStep };
  if (!together) return { ...common, status: 'apart' as const };
  return { ...common, status: 'together' as const, together };
}
