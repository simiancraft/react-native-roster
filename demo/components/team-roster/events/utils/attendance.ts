import { extentOf, type IntervalInput, unionOf } from 'react-native-roster';
import type { Window } from 'react-native-roster/core';
import { memberMeta } from '../../utils/team';
import type { MemberEvent } from '../event.types';

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

export function attendanceModelFor(event: MemberEvent, now: number) {
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
    return { attendance, attendee };
  });
  return { status, event, scale, rows, now };
}
