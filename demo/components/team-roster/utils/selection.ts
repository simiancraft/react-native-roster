import type { Rect, Source } from 'react-native-roster/core';
import type { Member, MemberEvent } from '../members/member.types';
import type { Selection } from '../team-roster.types';

/** What removed time means per source kind; rules are the lunch exclusion, dates are days off. */
const TIME_OFF: Record<string, (source: Source) => string> = {
  rule: () => 'Lunch break',
  date: (source) => source.label ?? 'Out of office',
};

/** The selection a pressed rect explains: the event it belongs to, its time off, or nothing. */
export function selectionFor(member: Member, events: MemberEvent[], rect: Rect): Selection {
  const source = rect.sources[0];
  const event = events.find((candidate) => candidate.id === source?.id);
  if (event) return { kind: 'event', member, event };
  const note = source ? TIME_OFF[source.kind]?.(source) : undefined;
  return note ? { kind: 'timeOff', member, note } : { kind: 'none', member };
}
