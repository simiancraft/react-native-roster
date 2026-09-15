import { extentOf, type IntervalInput } from 'react-native-roster';
import type { Window } from 'react-native-roster/core';
import type { MemberEvent } from '../members/member.types';
import { memberMeta } from './team';

export function eventFor({
  lane,
  rect,
}: Pick<IntervalInput, 'lane' | 'rect'>): MemberEvent | undefined {
  return memberMeta(lane).events.find((event) =>
    rect.sources.some((source) => source.id === event.id && source.kind === event.kind),
  );
}

export function actualExtent(event: MemberEvent): Window | null {
  return extentOf(
    event.attendances.flatMap((attendance) => {
      if (attendance.state === 'attended')
        return [{ start: attendance.start, end: attendance.end }];
      if (attendance.state === 'present' && attendance.arrival < event.now)
        return [{ start: attendance.arrival, end: event.now }];
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

export function attendanceModelFor(event: MemberEvent) {
  const extent = actualExtent(event);
  const scale = {
    start: Math.min(event.start, extent?.start ?? event.start),
    end: Math.max(event.end, extent?.end ?? event.end),
  };
  const status = event.start >= event.now ? 'future' : event.end > event.now ? 'live' : 'past';
  return { status, event, scale };
}
