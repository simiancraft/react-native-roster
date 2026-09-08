import { Fragment } from 'react';
import { Pressable } from 'react-native';
import { pressPoint } from '../../roster/press-point';
import type { ScheduleColumnInput } from '../schedule.types';

export function ScheduleColumn({
  lane,
  rects,
  gapRects,
  press,
  intervalZone,
  gapZone,
  highlightSource,
}: ScheduleColumnInput) {
  return [...lane.layers]
    .sort((a, b) => a.z - b.z)
    .map((layer) => (
      <Fragment key={layer.id}>
        {rects
          .filter((rect) => rect.layerId === layer.id)
          .map((rect) => (
            <Fragment key={`interval-${rect.y}:${rect.height}`}>
              {intervalZone({
                rect,
                layer,
                lane,
                highlighted: rect.sources.some(
                  (source) =>
                    source.kind === highlightSource?.kind && source.id === highlightSource.id,
                ),
              })}
            </Fragment>
          ))}
        {gapRects
          .filter((rect) => rect.layerId === layer.id)
          .map((rect) => (
            <Pressable
              key={`gap-${rect.y}:${rect.height}`}
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
              {gapZone({ rect, layer, lane })}
            </Pressable>
          ))}
      </Fragment>
    ));
}
