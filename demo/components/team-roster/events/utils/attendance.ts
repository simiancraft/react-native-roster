import { extentOf, type IntervalInput, unionOf } from 'react-native-roster';
import type { Window } from 'react-native-roster/core';
import { offsetLabel, timeLabel } from '../../utils/format';
import { memberMeta } from '../../utils/team';
import type { Attendance, MemberEvent, Presence } from '../event.types';

export function eventFor({
  lane,
  rect,
}: Pick<IntervalInput, 'lane' | 'rect'>): MemberEvent | undefined {
  return memberMeta(lane).events.find(
    (event) =>
      rect.sources.length === 1 &&
      rect.sources.every((source) => source.id === event.id && source.kind === event.kind),
  );
}

export function actualExtent(event: MemberEvent, now: number): Window | null {
  return extentOf(actualWindows(event, now));
}

export function actualWindows(event: MemberEvent, now: number): Window[] {
  return unionOf(
    event.attendances.flatMap((attendance) => {
      if (attendance.state === 'attended')
        return [{ start: attendance.start, end: attendance.end }];
      if (attendance.state === 'present' && attendance.arrival < now)
        return [{ start: attendance.arrival, end: now }];
      return [];
    }),
  );
}

/** Offsets deliberately retain overhang outside the scheduled bounds. */
export function barOffsets(actual: Window, scale: Window, width = 100) {
  return {
    left: (width * (actual.start - scale.start)) / (scale.end - scale.start),
    width: (width * (actual.end - actual.start)) / (scale.end - scale.start),
  };
}

export function attendanceModelFor(event: MemberEvent, now: number, timezone = 'UTC') {
  const extent = actualExtent(event, now);
  const scale = {
    start: Math.min(event.start, extent?.start ?? event.start),
    end: Math.max(event.end, extent?.end ?? event.end),
  };
  const status: 'future' | 'live' | 'past' =
    event.start >= now ? 'future' : event.end > now ? 'live' : 'past';
  const rows = event.attendances.map((attendance) => {
    const attendee = event.expected.find((person) => person.id === attendance.attendeeId);
    if (!attendee) throw new Error(`Missing expected attendee ${attendance.attendeeId}`);
    let actual: Window | null = null;
    if (attendance.state === 'attended') actual = attendance;
    if (attendance.state === 'present') actual = { start: attendance.arrival, end: now };
    return {
      attendance,
      attendee,
      bar: actual ? barOffsets(actual, scale) : null,
      glyph: glyphFor(attendance.state),
      tooltip: tooltipTextFor(attendance, event, timezone),
    };
  });
  return {
    status,
    event,
    scale,
    rows,
    now,
    band: barOffsets(event, scale),
    ticks: ticksFor(scale, timezone),
  };
}

/** Tick positions follow wall-clock hours, including fractional-offset zones. */
export function ticksFor(scale: Window, timezone = 'UTC') {
  const step = scale.end - scale.start < 3 * 3600000 ? 30 : 60;
  const format = new Intl.DateTimeFormat('en-US', { timeZone: timezone, minute: 'numeric' });
  const ticks: { time: number; left: number }[] = [];
  for (let time = Math.ceil(scale.start / 60000) * 60000; time <= scale.end; time += 60000) {
    if (Number(format.format(time)) % step === 0) {
      ticks.push({ time, left: barOffsets({ start: time, end: time }, scale).left });
    }
  }
  return ticks;
}

export function glyphFor(state: Presence['state']) {
  return { expected: '', pending: '○', absent: '×', present: '●', attended: '' }[state];
}

export function tooltipTextFor(attendance: Attendance, event: MemberEvent, timezone: string) {
  switch (attendance.state) {
    case 'expected':
      return 'Expected to attend';
    case 'pending':
      return 'Not yet arrived';
    case 'absent':
      return 'Did not attend';
    case 'present':
      return `Arrived ${timeLabel(attendance.arrival, timezone)} (${offsetLabel(attendance.arrival, event.start)}) · Still here`;
    case 'attended':
      return `Arrived ${timeLabel(attendance.start, timezone)} (${offsetLabel(attendance.start, event.start)}) · Left ${timeLabel(attendance.end, timezone)} (${offsetLabel(attendance.end, event.end)})`;
  }
}

export type AttendanceModel = ReturnType<typeof attendanceModelFor>;
export type AttendanceRowModel = AttendanceModel['rows'][number];
