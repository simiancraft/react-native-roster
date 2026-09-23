import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type {
  DayColumn,
  Lane,
  LaneGeometry,
  Projection,
  Rect,
  ScopedCacheIdentity,
  Source,
  Transition,
  Window,
  WindowSpec,
} from '../../core';
import type { GapInput, IntervalInput } from '../layers/layers.types';
import type { WindowBandPiece } from './utils/window-band';

export type ScheduleWindowSpec = WindowSpec & { span: 'day' | 'week' };
export type ScheduleProjection = Extract<Projection, { orientation: 'columns' }>;
export type ScheduleInput = {
  lane: Lane;
  windowSpec: ScheduleWindowSpec;
  /** Stable cache identity for deliberate reuse across surfaces rendering one dataset. */
  cacheIdentity?: ScopedCacheIdentity;
  minuteStep?: number;
  /** Positive finite pixels per wall-clock hour; defaults to 48. */
  pxPerHour?: number;
  /** Current instant in epoch milliseconds; default null draws no now line. */
  now?: number | null;
  /** Absolute window projected as a translucent band without changing the displayed window. */
  bandWindow?: Window;
  highlightSource?: Source;
  onNavigate?: (next: WindowSpec) => void;
  /** Called when an ordinary day heading is activated. */
  onDayPress?: (day: DayColumn) => void;
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
  /** Visible pieces of bandWindow clipped and projected through the real day columns. */
  windowBandPieces: WindowBandPiece[];
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
  intervalComponent: ComponentType<IntervalInput>;
  /** Removed rect content shared with Roster; the column supplies its pressable bounds. */
  gapComponent: ComponentType<GapInput>;
};
export type ScheduleHoursInput = { hours: number[]; pxPerHour: number };
export type ScheduleDayHeaderInput = {
  day: DayColumn;
  /** Activates this heading's day when the Schedule supplies onDayPress. */
  onPress?: () => void;
};
/**
 * Chrome style props and their NativeWind class twins. Class props resolve only
 * after `react-native-roster/nativewind` registers the component; without that
 * entry they are ignored.
 */
export type ScheduleStyleProps = {
  /** Outer measured container. */
  style?: StyleProp<ViewStyle>;
  className?: string;
  /** Frozen day heading row, indented past the 48 px gutter. */
  headerStyle?: StyleProp<ViewStyle>;
  headerClassName?: string;
  /** Scrolling 48 px hour gutter. */
  gutterStyle?: StyleProp<ViewStyle>;
  gutterClassName?: string;
  /** Scrolling day column container beside the gutter. */
  daysStyle?: StyleProp<ViewStyle>;
  daysClassName?: string;
};
export type ScheduleProps = ScheduleInput &
  ScheduleStyleProps & {
    incompleteLabel?: string;
    /** Frozen left hour labels; ScheduleGutter receives hours 0 through 23 and their scale. */
    gutterComponent?: ComponentType<ScheduleHoursInput>;
    /** Hour bands behind each day's rects; ScheduleGrid draws 24 bordered bands. */
    gridComponent?: ComponentType<ScheduleHoursInput>;
    /** Frozen day heading; ScheduleDayHeader shows weekday, localDate, and a transition badge. */
    dayHeaderComponent?: ComponentType<ScheduleDayHeaderInput>;
    /** Wholly skipped local date marker; ScheduleSkippedDate labels its zero-width header gap. */
    skippedDateComponent?: ComponentType<{ localDate: string }>;
    /** The day's covered and removed rects; ScheduleColumn draws final bounds in layer order. */
    columnComponent?: ComponentType<ScheduleColumnInput>;
    /** Transition chrome only; ScheduleTransition hatches skips and divides repeats with again. */
    transitionComponent?: ComponentType<ScheduleTransitionInput>;
    /** Current day's line at y; ScheduleNowLine spans the containing column. */
    nowLineComponent?: ComponentType<{ y: number; column: number }>;
    /** Covered rect filler shared with Roster; position using rect bounds and use pointerEvents="none". */
    intervalComponent?: ComponentType<IntervalInput>;
    /** Removed rect content shared with Roster; ScheduleColumn supplies the invisible pressable. */
    gapComponent?: ComponentType<GapInput>;
    /** Completeness notice in reserved empty space above the day grid; receives the lane and localized label. */
    incompleteComponent?: ComponentType<{ lane: Lane; label: string }>;
  };
