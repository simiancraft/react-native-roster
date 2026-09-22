import type { ComponentType } from 'react';
import type { Lane, Layer, Rect, Source } from '../../core';

/** One covered span of a layer, positioned by the projection; `highlighted` follows the active source. */
export type IntervalInput = { rect: Rect; layer: Layer; lane: Lane; highlighted: boolean };
/** One removed span of a layer, positioned by the projection. */
export type GapInput = { rect: Rect; layer: Layer; lane: Lane };

export type LayerStackInput = {
  /** Lane whose ordered layers own the rendered rects. */
  lane: Lane;
  /** Final covered geometry selected by layer id. */
  rects: Rect[];
  /** Final removed geometry selected by layer id. */
  gapRects: Rect[];
  /** Receives a press translated into plot coordinates. */
  press: (x: number, y: number) => void;
  /** Component mounted for each covered rect. */
  intervalComponent: ComponentType<IntervalInput>;
  /** Component mounted for each removed rect. */
  gapComponent: ComponentType<GapInput>;
  /** Source identity highlighted across covered rects. */
  highlightSource?: Source;
};
