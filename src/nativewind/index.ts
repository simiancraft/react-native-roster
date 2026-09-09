import { cssInterop } from 'nativewind';
import { Roster as BaseRoster } from '../components/roster';
import type { RosterStyleProps } from '../components/roster/roster.types';
import { Schedule as BaseSchedule } from '../components/schedule';
import type { ScheduleStyleProps } from '../components/schedule/schedule.types';

type ClassNameKeys<T> = Extract<keyof T, `${string}className` | `${string}ClassName`>;
type StyleTarget<K extends string> = K extends `${infer Prefix}ClassName`
  ? `${Prefix}Style`
  : 'style';
type Mapping<T> = { [K in ClassNameKeys<T>]-?: StyleTarget<K> };

/** Each class prop resolves into the style prop of the same chrome region. */
export const rosterClassNames: Mapping<RosterStyleProps> = {
  className: 'style',
  headerClassName: 'headerStyle',
  laneLabelColumnClassName: 'laneLabelColumnStyle',
  bodyClassName: 'bodyStyle',
};
export const scheduleClassNames: Mapping<ScheduleStyleProps> = {
  className: 'style',
  headerClassName: 'headerStyle',
  gutterClassName: 'gutterStyle',
  daysClassName: 'daysStyle',
};

// Registration lets NativeWind's JSX runtime resolve class props on the root
// components; the returned wrappers serve consumers without that runtime.
export const Roster = cssInterop(BaseRoster, rosterClassNames);
export const Schedule = cssInterop(BaseSchedule, scheduleClassNames);
