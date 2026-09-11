import { hitTest } from '../../../core/hit-test';
import { pressPoint } from '../../primitives/press-point.web';
import type { IntervalHoverInput, IntervalHoverProps } from './interval-hover.types';

export function intervalHoverProps({
  lane,
  geometry,
  onIntervalHover,
}: IntervalHoverInput): IntervalHoverProps {
  if (!onIntervalHover) return {};
  return {
    onPointerMove(input) {
      if (input.nativeEvent.pointerType === 'touch') return;
      const { x, y } = pressPoint(input);
      const hit = hitTest(lane, geometry, x, y);
      if (hit?.kind === 'interval') onIntervalHover(hit.rect, lane);
    },
  };
}
