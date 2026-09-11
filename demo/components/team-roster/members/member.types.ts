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
  start: number;
  end: number;
};
export type MemberLaneMeta = { member: Member; events: MemberEvent[] };
