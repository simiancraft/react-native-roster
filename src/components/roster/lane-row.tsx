import { Fragment } from 'react';
import { Pressable } from 'react-native';
import type { Lane, LaneGeometry } from '../../core';
import { pressPoint } from './press-point';
import type { BodyInput } from './roster.types';

export type LaneRowProps = Pick<
  BodyInput,
  'press' | 'intervalZone' | 'gapZone' | 'highlightSource'
> & {
  lane: Lane;
  geometry: LaneGeometry;
  width: number;
  rowHeight: number;
};

export function LaneRow({
  lane,
  geometry,
  width,
  rowHeight,
  press,
  intervalZone,
  gapZone,
  highlightSource,
}: LaneRowProps) {
  const layers = [...lane.layers].sort((a, b) => a.z - b.z);
  return (
    <Pressable
      testID={`roster-lane-${lane.id}`}
      accessibilityLabel={lane.label}
      onPress={(input) => {
        const point = pressPoint(input);
        press(lane, point.x, point.y);
      }}
      style={{ width, height: rowHeight }}
    >
      {layers.map((layer) => (
        <Fragment key={layer.id}>
          {geometry.rects
            .filter((rect) => rect.layerId === layer.id)
            .map((rect) => (
              <Fragment key={`interval-${rect.x}:${rect.width}`}>
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
          {geometry.gapRects
            .filter((rect) => rect.layerId === layer.id)
            .map((rect) => (
              <Pressable
                key={`gap-${rect.x}:${rect.width}`}
                accessibilityLabel={`${lane.label}: removed time`}
                onPress={(input) => {
                  input.stopPropagation();
                  const point = pressPoint(input);
                  press(lane, rect.x + point.x, rect.y + point.y);
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
      ))}
    </Pressable>
  );
}
