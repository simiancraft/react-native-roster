import type { ScheduleWindowSpec } from 'react-native-roster';
import type { Member } from './members/member.types';

/** The generated organization and its people. */
export type Team = { organization: string; members: Member[] };

export type SortKey = 'name' | 'availability' | 'free';
export type SpanKey = ScheduleWindowSpec['span'];
export type WeekDensity = 'fitted' | 'detailed';
/** The full week expanded for the member inspector. */
export type WeekWindowSpec = ScheduleWindowSpec & { span: 'week' };
/** How much of each person fits beside the lanes: full card, stacked name, or avatar only. */
export type Density = 'full' | 'compact' | 'avatar';
/** What the inspector explains for the selected member. */
export type Selection =
  | { kind: 'timeOff'; member: Member; note: string }
  | { kind: 'slot'; member: Member; time: number }
  | { kind: 'none'; member: Member };

export const VIEW_TIMEZONES = ['America/Chicago', 'Europe/London', 'Asia/Tokyo', 'UTC'] as const;
