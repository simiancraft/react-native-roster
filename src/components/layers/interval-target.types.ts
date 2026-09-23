import type { ReactNode } from 'react';
import type { Lane, Layer, Rect, Window } from '../../core';
import type { RectTargetRef } from './layers.types';

export type IntervalTargetInput = {
  children: ReactNode;
  kind: 'interval' | 'gap';
  rect: Rect;
  layer: Layer;
  lane: Lane;
  bounds: Window;
  viewTimezone: string;
  onActivate: (target: RectTargetRef) => void;
  onPoint: (x: number, y: number) => void;
};
