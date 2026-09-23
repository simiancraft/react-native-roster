import { Fragment } from 'react';
import { hasSource } from '../../core';
import { IntervalTarget } from './interval-target';
import type { LayerStackInput } from './layers.types';

function rectKey(kind: 'interval' | 'gap', rect: LayerStackInput['rects'][number], index: number) {
  return `${kind}-${rect.column ?? 'row'}:${rect.x}:${rect.y}:${rect.width}:${rect.height}:${index}`;
}

export function LayerStack({
  lane,
  rects,
  gapRects,
  press,
  boundsFor,
  viewTimezone,
  activateInterval,
  activateGap,
  intervalComponent: IntervalComponent,
  gapComponent: GapComponent,
  highlightSource,
}: LayerStackInput) {
  const layers = [...lane.layers].sort((a, b) => a.z - b.z);
  return layers.map((layer) => (
    <Fragment key={layer.id}>
      {rects
        .filter((rect) => rect.layerId === layer.id)
        .map((rect, index) => (
          <IntervalTarget
            key={rectKey('interval', rect, index)}
            kind="interval"
            rect={rect}
            layer={layer}
            lane={lane}
            bounds={boundsFor(rect)}
            viewTimezone={viewTimezone}
            onActivate={(target) => activateInterval(rect, lane, target)}
            onPoint={press}
          >
            <IntervalComponent
              rect={rect}
              layer={layer}
              lane={lane}
              highlighted={hasSource(rect.sources, highlightSource)}
            />
          </IntervalTarget>
        ))}
      {gapRects
        .filter((rect) => rect.layerId === layer.id)
        .map((rect, index) => (
          <IntervalTarget
            key={rectKey('gap', rect, index)}
            kind="gap"
            rect={rect}
            layer={layer}
            lane={lane}
            bounds={boundsFor(rect)}
            viewTimezone={viewTimezone}
            onActivate={(target) => activateGap(rect, lane, target)}
            onPoint={press}
          >
            <GapComponent rect={rect} layer={layer} lane={lane} />
          </IntervalTarget>
        ))}
    </Fragment>
  ));
}
