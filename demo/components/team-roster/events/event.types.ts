import type { Member } from '../members/member.types';

export type EventKind = 'meeting' | 'focus' | 'session';
export type MemberEvent = {
  id: string;
  kind: EventKind;
  title: string;
  description: string;
  expected: Pick<Member, 'id' | 'name'>[];
  facts: AttendanceFact[];
  attendances: Attendance[];
  start: number;
  end: number;
};
export type Presence =
  | { state: 'expected' }
  | { state: 'pending' }
  | { state: 'present'; arrival: number }
  | { state: 'attended'; start: number; end: number }
  | { state: 'absent' };
export type Attendance = { attendeeId: string } & Presence;

/** Seeded facts do not depend on the display clock. */
export type AttendanceFact = {
  attendeeId: string;
  arrival: number | null;
  departure: number | null;
};
