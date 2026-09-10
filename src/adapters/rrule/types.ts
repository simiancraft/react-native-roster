import type { Gap, Interval, Weekday, Window } from '../../core';

export type RosterRule = {
  id: string;
  kind: 'include' | 'exclude';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  dtstart: string;
  until?: string;
  count?: number;
  interval?: number;
  wkst?: Weekday;
  byweekday?: Weekday[];
  bymonth?: number[];
  bymonthday?: number[];
  bysetpos?: number[];
  /** Local hours in timezone, end-exclusive; 24 means next local midnight. */
  hourstart: number;
  hourend: number;
  timezone: string;
};

export type RosterDate = {
  id: string;
  kind: 'include' | 'exclude';
  date: string;
  timezone: string;
  note?: string;
  /** Both hours present for a partial day, or both absent for the whole day. */
  hourstart?: number;
  hourend?: number;
};

export type RuleSet = { rules: RosterRule[]; dates: RosterDate[] };
export type ExpandOptions = {
  cache?: { maxEntries?: number; maxEnvelopes?: number };
  caps?: { perRuleOccurrences?: number; totalOccurrences?: number };
};
export type ExpandStats = {
  rules: number;
  dates: number;
  expanded: number;
  cacheHits: number;
  cacheMisses: number;
};
export type ExpandResult = {
  intervals: Interval[];
  gaps: Gap[];
  envelope: Window;
  complete: boolean;
  truncated: Array<{ id: string; droppedAtLeast: number }>;
  stats: ExpandStats;
};
