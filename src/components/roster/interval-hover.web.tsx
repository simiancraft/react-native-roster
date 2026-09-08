import type { IntervalHoverInput, IntervalHoverProps } from './interval-hover.types';
import { pressPoint } from './press-point.web';
import { hitTest } from './utils/hit-test';

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
