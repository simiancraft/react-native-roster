import { Fragment } from 'react';
import { Pressable } from 'react-native';
import { hasSource } from '../../core';
import { pressPoint } from '../primitives/press-point';
import type { LayerStackInput } from './layers.types';

function rectKey(kind: 'interval' | 'gap', rect: LayerStackInput['rects'][number], index: number) {
  return `${kind}-${rect.column ?? 'row'}:${rect.x}:${rect.y}:${rect.width}:${rect.height}:${index}`;
}

export function LayerStack({
  lane,
  rects,
  gapRects,
  press,
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
          <Fragment key={rectKey('interval', rect, index)}>
            <IntervalComponent
              rect={rect}
              layer={layer}
              lane={lane}
              highlighted={hasSource(rect.sources, highlightSource)}
            />
          </Fragment>
        ))}
      {gapRects
        .filter((rect) => rect.layerId === layer.id)
        .map((rect, index) => (
          <Pressable
            key={rectKey('gap', rect, index)}
            accessibilityLabel={`${lane.label}: removed time`}
            onPress={(input) => {
              input.stopPropagation();
              const point = pressPoint(input);
              press(rect.x + point.x, rect.y + point.y);
            }}
            style={{
              position: 'absolute',
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              zIndex: rect.z,
            }}
          >
            <GapComponent rect={rect} layer={layer} lane={lane} />
          </Pressable>
        ))}
    </Fragment>
  ));
}
