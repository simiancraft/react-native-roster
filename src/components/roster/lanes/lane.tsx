import { Pressable } from 'react-native';
import type { Lane, LaneGeometry } from '../../../core';
import { LayerStack } from '../../layers/layer-stack';
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
      <LayerStack
        lane={lane}
        rects={geometry.rects}
        gapRects={geometry.gapRects}
        press={(x, y) => press(lane, x, y)}
        intervalComponent={IntervalComponent}
        gapComponent={GapComponent}
        highlightSource={highlightSource}
      />
    </Pressable>
  );
}
