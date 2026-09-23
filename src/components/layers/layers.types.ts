import type { ComponentType, RefObject } from 'react';
import type { Lane, Layer, Rect, Source, Window } from '../../core';

/** One covered span of a layer, positioned by the projection; `highlighted` follows the active source. */
export type IntervalInput = { rect: Rect; layer: Layer; lane: Lane; highlighted: boolean };
/** One removed span of a layer, positioned by the projection. */
export type GapInput = { rect: Rect; layer: Layer; lane: Lane };
/** Mounted accessible target retained for native selection focus restoration. */
export type RectTargetRef = RefObject<unknown>;
/** Activates one exact projected rect without coordinate hit-testing. */
export type RectActivation = (rect: Rect, lane: Lane, target?: RectTargetRef) => void;

export type LayerStackInput = {
  /** Lane whose ordered layers own the rendered rects. */
  lane: Lane;
  /** Final covered geometry selected by layer id. */
  rects: Rect[];
  /** Final removed geometry selected by layer id. */
  gapRects: Rect[];
  /** Resolves the rect's exact absolute bounds in this projection. */
  boundsFor: (rect: Rect) => Window;
  /** Retains coordinate hit-testing for real pointer presses. */
  press: (x: number, y: number) => void;
  /** View zone used to name absolute bounds, including repeated-hour offsets. */
  viewTimezone: string;
  /** Directly activates one covered rect. */
  activateInterval: RectActivation;
  /** Directly activates one removed rect. */
  activateGap: RectActivation;
  /** Component mounted for each covered rect. */
  intervalComponent: ComponentType<IntervalInput>;
  /** Component mounted for each removed rect. */
  gapComponent: ComponentType<GapInput>;
  /** Source identity highlighted across covered rects. */
  highlightSource?: Source;
};
