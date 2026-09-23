import { LayerStack } from '../../../layers/layer-stack';
import type { ScheduleColumnInput } from '../../schedule.types';

export function ScheduleColumn({
  lane,
  rects,
  gapRects,
  press,
  activateInterval,
  activateGap,
  boundsFor,
  viewTimezone,
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
      boundsFor={boundsFor}
      viewTimezone={viewTimezone}
      activateInterval={activateInterval}
      activateGap={activateGap}
      intervalComponent={IntervalComponent}
      gapComponent={GapComponent}
      highlightSource={highlightSource}
    />
  );
}
