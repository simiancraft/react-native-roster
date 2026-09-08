import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type {
  DayColumn,
  Lane,
  LaneGeometry,
  Projection,
  Rect,
  Source,
  Transition,
  Window,
  WindowSpec,
} from '../../core';
import type { GapInput, IntervalInput } from '../roster/roster.types';

export type ScheduleWindowSpec = WindowSpec & { span: 'day' | 'week' };
export type ScheduleProjection = Extract<Projection, { orientation: 'columns' }>;
export type ScheduleInput = {
  lane: Lane;
  windowSpec: ScheduleWindowSpec;
  minuteStep?: number;
  /** Positive finite pixels per wall-clock hour; defaults to 48. */
  pxPerHour?: number;
  highlightSource?: Source;
  onNavigate?: (next: WindowSpec) => void;
  onIntervalPress?: (rect: Rect, lane: Lane) => void;
  onGapPress?: (rect: Rect, lane: Lane) => void;
  onCellPress?: (lane: Lane, time: number) => void;
};
export type ScheduleModel = {
  window: Window;
  days: DayColumn[];
  projection: ScheduleProjection;
  geometry: LaneGeometry;
  now: number | null;
  press: (columnIndex: number, x: number, y: number) => void;
  status: 'ready';
};
export type ScheduleTransitionInput = {
  day: DayColumn;
  transition: Transition;
  /** Projected transition instant, separating repeated occurrences. */
  dividerY: number;
  y: number;
  height: number;
  width: number;
};
export type ScheduleColumnInput = {
  day: DayColumn;
  rects: Rect[];
  gapRects: Rect[];
  lane: Lane;
  highlightSource?: Source;
  press: (x: number, y: number) => void;
  /** Covered rect filler shared with Roster; final bounds and stacking belong to the rect. */
  intervalZone: (input: IntervalInput) => ReactNode;
  /** Removed rect content shared with Roster; the column supplies its pressable bounds. */
  gapZone: (input: GapInput) => ReactNode;
};
export type ScheduleProps = ScheduleInput & {
  style?: StyleProp<ViewStyle>;
  incompleteLabel?: string;
  /** Frozen left hour labels; ScheduleGutter receives hours 0 through 23 and their scale. */
  gutterZone?: (input: { hours: number[]; pxPerHour: number }) => ReactNode;
  /** Frozen day heading; ScheduleDayHeader shows weekday, localDate, and a transition badge. */
  dayHeaderZone?: (input: { day: DayColumn }) => ReactNode;
  /** Wholly skipped local date marker; ScheduleSkippedDate labels its zero-width header gap. */
  skippedDateZone?: (input: { localDate: string }) => ReactNode;
  /** The day's covered and removed rects; ScheduleColumn draws final bounds in layer order. */
  columnZone?: (input: ScheduleColumnInput) => ReactNode;
  /** Transition chrome only; ScheduleTransition hatches skips and divides repeats with again. */
  transitionZone?: (input: ScheduleTransitionInput) => ReactNode;
  /** Current day's line at y; ScheduleNowLine spans the containing column. */
  nowLineZone?: (input: { y: number; column: number }) => ReactNode;
  /** Covered rect filler shared with Roster; position using rect bounds and use pointerEvents="none". */
  intervalZone?: (input: IntervalInput) => ReactNode;
  /** Removed rect content shared with Roster; ScheduleColumn supplies the invisible pressable. */
  gapZone?: (input: GapInput) => ReactNode;
  /** Completeness notice in reserved empty space above the day grid; receives the lane and localized label. */
  incompleteZone?: (input: { lane: Lane; label: string }) => ReactNode;
};
