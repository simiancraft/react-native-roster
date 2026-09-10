import type { Lane, LaneGeometry, Rect } from '../../core';
import type { PressPointInput } from '../primitives/press-point.types';

export type IntervalHoverInput = {
  lane: Lane;
  geometry: LaneGeometry;
  onIntervalHover?: (rect: Rect, lane: Lane) => void;
};
export type IntervalHoverProps = {
  onPointerMove?: (input: PressPointInput & { nativeEvent: { pointerType?: string } }) => void;
};
