import type { ReactNode, RefObject } from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import type {
  Coverage,
  Lane,
  LaneComparator,
  LaneFlag,
  LaneGeometry,
  Layer,
  Projection,
  Rect,
  Source,
  Window,
  WindowSpec,
} from '../../core';

export type RosterProjection = Extract<Projection, { orientation: 'horizontal' }>;
export type RosterTick = { time: number; x: number; label: string; kind: 'day' | 'time' };
export type RosterScroll = {
  x: SharedValue<number>;
  y: SharedValue<number>;
  bodyRef: RefObject<ScrollView | null>;
  onBodyScroll: (input: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onHeaderScroll: (input: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onVerticalScroll: (input: NativeSyntheticEvent<NativeScrollEvent>) => void;
  headerStyle: StyleProp<ViewStyle>;
  labelStyle: StyleProp<ViewStyle>;
};
export type RosterInput = {
  lanes: Lane[];
  windowSpec: WindowSpec;
  minuteStep?: number;
  sortLanes?: LaneComparator;
  highlightSource?: Source;
  onNavigate?: (next: WindowSpec) => void;
  onIntervalPress?: (rect: Rect, lane: Lane) => void;
  /** Reports the winning interval under a web pointer; native renders attach no hover handler. */
  onIntervalHover?: (rect: Rect, lane: Lane) => void;
  onGapPress?: (rect: Rect, lane: Lane) => void;
  onCellPress?: (lane: Lane, time: number) => void;
  /** Fixed lane height, default 48. */
  rowHeight?: number;
  /** Minimum elapsed-time scale, default 0.5; expands to fit wider viewports. */
  pxPerMinute?: number;
};
export type RosterModel = {
  window: Window;
  projection: RosterProjection;
  orderedLanes: Lane[];
  coverage: ReadonlyMap<string, Coverage>;
  laneState: ReadonlyMap<string, { flag: LaneFlag; complete: boolean }>;
  geometryFor: (lane: Lane) => LaneGeometry;
  scroll: RosterScroll;
  press: (lane: Lane, x: number, y: number) => void;
  status: 'empty' | 'ready';
  ticks: RosterTick[];
  contentWidth: number;
  viewport: { width: number; height: number };
  onLayout: (input: LayoutChangeEvent) => void;
  navigate: (next: WindowSpec) => void;
};
export type LaneLabelInput = {
  lane: Lane;
  flag: LaneFlag;
  complete: boolean;
  viewTimezone: string;
  incompleteLabel: string;
  neverSetLabel: string;
};
export type IntervalInput = { rect: Rect; layer: Layer; lane: Lane; highlighted: boolean };
export type GapInput = { rect: Rect; layer: Layer; lane: Lane };
export type GridInput = { ticks: RosterTick[]; contentWidth: number };
export type HeaderInput = Pick<RosterModel, 'ticks' | 'projection' | 'scroll' | 'contentWidth'> & {
  /** Time label filler, positioned by the header. */
  headerCellZone: (input: { tick: RosterTick }) => ReactNode;
};
export type LabelColumnInput = Pick<RosterModel, 'projection' | 'scroll'> & {
  labels: LaneLabelInput[];
  /** Lane label filler, positioned at the fixed row height. */
  laneLabelZone: (input: LaneLabelInput) => ReactNode;
};
export type BodyInput = Pick<
  RosterModel,
  | 'geometryFor'
  | 'projection'
  | 'scroll'
  | 'press'
  | 'ticks'
  | 'contentWidth'
  | 'viewport'
  | 'window'
> & {
  lanes: Lane[];
  highlightSource?: Source;
  onIntervalHover?: (rect: Rect, lane: Lane) => void;
  incompleteLabel?: string;
  /** Covered rect view; position it using the final rect bounds, as RosterInterval does. */
  intervalZone: (input: IntervalInput) => ReactNode;
  /** Removed rect filler, placed inside a pressable by LaneRow. */
  gapZone: (input: GapInput) => ReactNode;
  /** Noninteractive tick lines behind every lane, sized to the content width. */
  gridZone: (input: GridInput) => ReactNode;
};
/**
 * Chrome style props and their NativeWind class twins. Class props resolve only
 * after `react-native-roster/nativewind` registers the component; without that
 * entry they are ignored.
 */
export type RosterStyleProps = {
  /** Outer container; supply a bounded height. */
  style?: StyleProp<ViewStyle>;
  className?: string;
  /** Frozen header row holding the corner and tick strip, 40 px tall by default. */
  headerStyle?: StyleProp<ViewStyle>;
  headerClassName?: string;
  /** Frozen lane label column, laneLabelWidth wide. */
  laneLabelColumnStyle?: StyleProp<ViewStyle>;
  laneLabelColumnClassName?: string;
  /** Measured body viewport containing the virtualized lanes. */
  bodyStyle?: StyleProp<ViewStyle>;
  bodyClassName?: string;
  /** Width of the corner and lane label column, default 180. */
  laneLabelWidth?: number;
};
export type RosterProps = RosterInput &
  RosterStyleProps & {
    incompleteLabel?: string;
    neverSetLabel?: string;
    /** Label, differing lane zone, effective flag, and completeness notice. */
    laneLabelZone?: (input: LaneLabelInput) => ReactNode;
    /** Time label within one positioned header tick. */
    headerCellZone?: (input: { tick: RosterTick }) => ReactNode;
    /** Covered rect view; use rect bounds for absolute position, rect.z for stacking, and pointerEvents="none" for row hit testing. */
    intervalZone?: (input: IntervalInput) => ReactNode;
    /** Removed rect content; LaneRow supplies the invisible pressable. */
    gapZone?: (input: GapInput) => ReactNode;
    /** Tick lines behind the lanes; RosterGrid draws one hairline per tick. */
    gridZone?: (input: GridInput) => ReactNode;
    /** Empty roster content, conventionally the text No lanes. */
    emptyZone?: () => ReactNode;
    /** Top-left cell above the lane labels; RosterCorner renders nothing. */
    cornerZone?: () => ReactNode;
    /** Frozen time header, supplied with ticks, scale, and shared scrolling. */
    headerZone?: (input: HeaderInput) => ReactNode;
    /** Frozen labels, supplied with ordered lanes and per-lane flag and completeness. */
    laneLabelColumnZone?: (input: LabelColumnInput) => ReactNode;
    /** Virtualized lane body, supplied with geometry, projection, scrolling, and press resolution. */
    bodyZone?: (input: BodyInput) => ReactNode;
  };
