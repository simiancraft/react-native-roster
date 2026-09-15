import type { Weekday } from 'react-native-roster/core';
import type { RuleSet } from 'react-native-roster/rrule';

export type EventKind = 'meeting' | 'focus' | 'session';
export type Member = {
  id: string;
  name: string;
  initials: string;
  role: string;
  team: string;
  timezone: string;
  /** Tailwind color family used by the label avatar and the availability band. */
  tone: 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'teal';
  workdays: Weekday[];
  hours: { start: number; end: number };
  rules: RuleSet;
};
export type MemberEvent = {
  id: string;
  kind: EventKind;
  title: string;
  description: string;
  expected: Pick<Member, 'id' | 'name'>[];
  now: number;
  attendances: Attendance[];
  start: number;
  end: number;
};
export type MemberLaneMeta = { member: Member; events: MemberEvent[] };

export type Presence =
  | { state: 'expected' }
  | { state: 'pending' }
  | { state: 'present'; arrival: number }
  | { state: 'attended'; start: number; end: number }
  | { state: 'absent' };
export type Attendance = { attendeeId: string } & Presence;
