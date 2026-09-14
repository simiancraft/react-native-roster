import type { Window } from 'react-native-roster/core';
import type { AttendanceMode, Attendee } from '../attendance.types';

/** Rejoins intentionally retain the entire first-arrival to last-departure span. */
export function collapse(segments: readonly Window[]): Window | null {
  if (segments.length === 0) return null;
  return {
    start: Math.min(...segments.map((segment) => segment.start)),
    end: Math.max(...segments.map((segment) => segment.end)),
  };
}

export function overlap(spans: Window[]): Window | null {
  if (spans.length === 0) return null;
  const start = Math.max(...spans.map((span) => span.start));
  const end = Math.min(...spans.map((span) => span.end));
  return start < end ? { start, end } : null;
}

export function togetherFor(attendees: Attendee[], mode: AttendanceMode): Window | null {
  if (mode.kind === 'anchor') {
    const anchor = attendees.find((attendee) => attendee.id === mode.attendeeId);
    if (!anchor) throw new Error('The anchor must be an attendee');
    return collapse(anchor.presence);
  }
  const spans = attendees.map((attendee) => collapse(attendee.presence));
  if (spans.some((span) => span === null)) return null;
  return overlap(spans.filter((span): span is Window => span !== null));
}

/** Disjoint leading and trailing spans inside the presence bar. No overlap means all time is dead. */
export function deadTime(presence: Window, together: Window | null) {
  const shared = together && overlap([presence, together]);
  if (!shared && together && presence.start >= together.end) {
    return { waiting: 0, lingering: presence.end - presence.start };
  }
  if (!shared) return { waiting: presence.end - presence.start, lingering: 0 };
  return { waiting: shared.start - presence.start, lingering: presence.end - shared.end };
}
