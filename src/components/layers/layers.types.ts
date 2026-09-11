import type { Lane, Layer, Rect } from '../../core';

/** One covered span of a layer, positioned by the projection; `highlighted` follows the active source. */
export type IntervalInput = { rect: Rect; layer: Layer; lane: Lane; highlighted: boolean };
/** One removed span of a layer, positioned by the projection. */
export type GapInput = { rect: Rect; layer: Layer; lane: Lane };
