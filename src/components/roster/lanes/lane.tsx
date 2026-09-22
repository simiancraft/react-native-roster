import { Fragment } from 'react';
import { Pressable } from 'react-native';
import type { Lane, LaneGeometry } from '../../../core';
import { hasSource } from '../../../core';
import { pressPoint } from '../../primitives/press-point';
import type { BodyInput } from '../roster.types';
import { intervalHoverProps } from './interval-hover';

export type LaneRowProps = Pick<
  BodyInput,
  | 'press'
  | 'intervalComponent'
  | 'gapComponent'
  | 'highlightSource'
  | 'onIntervalHover'
  | 'incompleteLabel'
  | 'incompleteComponent'
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
  intervalComponent: IntervalComponent,
  gapComponent: GapComponent,
  highlightSource,
  onIntervalHover,
  incompleteComponent: IncompleteComponent,
  incompleteLabel = 'Availability may be incomplete',
}: LaneRowProps) {
  const layers = [...lane.layers].sort((a, b) => a.z - b.z);
  return (
    <Pressable
      {...intervalHoverProps({ lane, geometry, onIntervalHover })}
      testID={`roster-lane-${lane.id}`}
      accessibilityLabel={lane.label}
      onPress={(input) => {
        const point = pressPoint(input);
        press(lane, point.x, point.y);
      }}
      style={{ width, height: rowHeight }}
    >
      <IncompleteComponent lane={lane} geometry={geometry} width={width} label={incompleteLabel} />
      {layers.map((layer) => (
        <Fragment key={layer.id}>
          {geometry.rects
            .filter((rect) => rect.layerId === layer.id)
            .map((rect) => (
              <Fragment key={`interval-${rect.x}:${rect.width}`}>
                <IntervalComponent
                  rect={rect}
                  layer={layer}
                  lane={lane}
                  highlighted={hasSource(rect.sources, highlightSource)}
                />
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
                <GapComponent rect={rect} layer={layer} lane={lane} />
              </Pressable>
            ))}
        </Fragment>
      ))}
    </Pressable>
  );
}
