import type { Rect } from 'react-native-roster/core';
import type { Member, MemberEvent } from '../members/member.types';
import type { Selection } from '../team-roster.types';
import { timeOffNote } from './time-off';

/** The selection a pressed rect explains: its time off or no inspector detail. */
export function selectionFor(member: Member, events: MemberEvent[], rect: Rect): Selection {
  const source = rect.sources[0];
  const event = events.find((candidate) => candidate.id === source?.id);
  if (event) return { kind: 'none', member };
  const note = timeOffNote(source);
  return note ? { kind: 'timeOff', member, note } : { kind: 'none', member };
}
