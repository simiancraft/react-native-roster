import { LayerStack } from '../../../layers/layer-stack';
import type { ScheduleColumnInput } from '../../schedule.types';

export function ScheduleColumn({
  lane,
  rects,
  gapRects,
  press,
  intervalComponent: IntervalComponent,
  gapComponent: GapComponent,
  highlightSource,
}: ScheduleColumnInput) {
  return (
    <LayerStack
      lane={lane}
      rects={rects}
      gapRects={gapRects}
      press={press}
      intervalComponent={IntervalComponent}
      gapComponent={GapComponent}
      highlightSource={highlightSource}
    />
  );
}
