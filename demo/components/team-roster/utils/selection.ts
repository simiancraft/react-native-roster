import type { Rect } from 'react-native-roster/core';
import type { Member } from '../members/member.types';
import type { Selection } from '../team-roster.types';
import { timeOffNote } from './time-off';

/** The selection a pressed rect explains: its time off or no inspector detail. */
export function selectionFor(member: Member, rect: Rect): Selection {
  const source = rect.sources[0];
  const note = timeOffNote(source);
  return note ? { kind: 'timeOff', member, note } : { kind: 'none', member };
}
