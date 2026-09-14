import type { Window } from 'react-native-roster/core';

export type EventKind = 'standup' | 'workshop' | 'review';
export type AttendanceStatus = 'on-time' | 'late' | 'left-early' | 'late-and-left-early' | 'missed';
export type Attendee = { id: string; name: string; presence: Window[] };
export type Attendance = {
  id: string;
  title: string;
  description: string;
  kind: EventKind;
  plan: Window;
  timezone: string;
  attendees: [Attendee, ...Attendee[]];
};
export type AttendanceMode = { kind: 'everyone' } | { kind: 'anchor'; attendeeId: string };
export type AttendanceMeta = {
  attendance: Attendance;
  attendee: Attendee;
  presence: Window | null;
  together: Window | null;
  status: AttendanceStatus;
  minutes: { present: number; together: number; dead: number };
};
