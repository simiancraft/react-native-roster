import type { Dispatch, SetStateAction } from 'react';
import { useRef, useState } from 'react';
import type { Lane, Window } from '../../core';
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
  selection: RosterModel['selection'],
  setSelected: Dispatch<SetStateAction<SelectedInterval | null>>,
) {
  const currentPress = { input, window, projection, width, selection };
  const pressInput = useRef(currentPress);
  pressInput.current = currentPress;
  const [press] = useState(() => {
    return function press(lane: Lane, pointX: number, pointY: number): void {
      const { input, window, projection, width, selection } = pressInput.current;
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
        if (input.selectable) {
          const layer = lane.layers.find((layer) => layer.id === hit.rect.layerId);
          // layoutLane supplied the hit rect's layerId, so this should succeed; guard future refactors.
          if (layer === undefined) return;
          // Compare reconciled geometry so resizing and cache eviction preserve toggle identity.
          setSelected(
            selection?.lane.id === lane.id &&
              selection.rect.layerId === hit.rect.layerId &&
              selection.rect.x === hit.rect.x &&
              selection.rect.width === hit.rect.width
              ? null
              : {
                  rect: hit.rect,
                  layer,
                  lane,
                  start: timeAtX(projection, window, hit.rect.x),
                  end: timeAtX(projection, window, hit.rect.x + hit.rect.width),
                },
          );
        }
        onIntervalPress?.(hit.rect, lane);
        return;
      }
      if (selection) setSelected(null);
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
