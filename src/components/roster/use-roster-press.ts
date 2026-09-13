import type { Dispatch, SetStateAction } from 'react';
import { useRef, useState } from 'react';
import type { Lane, Layer, Window } from '../../core';
import { layoutLane, snapToStep, timeAtX } from '../../core';
import { hitTest } from '../../core/hit-test';
import type { RosterInput, RosterModel, RosterProjection } from './roster.types';

export type SelectedInterval = NonNullable<RosterModel['selection']>;

// Isolate the stable press ref so it does not prevent compilation of derived roster values.
export function useRosterPress(
  input: RosterInput,
  window: Window,
  projection: RosterProjection,
  width: number,
  setSelected: Dispatch<SetStateAction<SelectedInterval | null>>,
) {
  const currentPress = { input, window, projection, width };
  const pressInput = useRef(currentPress);
  pressInput.current = currentPress;
  const [press] = useState(() => {
    return function press(lane: Lane, pointX: number, pointY: number): void {
      const { input, window, projection, width } = pressInput.current;
      const { minuteStep = 60, onIntervalPress, onGapPress, onCellPress } = input;
      const { rowHeight, viewTimezone } = projection;
      if (
        !Number.isFinite(pointX) ||
        !Number.isFinite(pointY) ||
        pointX < 0 ||
        pointX >= width ||
        pointY < 0 ||
        pointY >= rowHeight
      )
        return;
      const hit = hitTest(lane, layoutLane(lane, window, projection), pointX, pointY);
      if (hit?.kind === 'interval') {
        if (input.intervalDetailComponent) {
          const layer = lane.layers.find((layer) => layer.id === hit.rect.layerId) as Layer;
          setSelected({
            rect: hit.rect,
            layer,
            lane,
            start: timeAtX(projection, window, hit.rect.x),
            end: timeAtX(projection, window, hit.rect.x + hit.rect.width),
          });
        }
        onIntervalPress?.(hit.rect, lane);
        return;
      }
      if (hit?.kind === 'gap') {
        onGapPress?.(hit.rect, lane);
        return;
      }
      const time = Math.max(
        window.start,
        snapToStep(timeAtX(projection, window, pointX), minuteStep, viewTimezone),
      );
      if (time < window.end) onCellPress?.(lane, time);
    };
  });
  return press;
}
