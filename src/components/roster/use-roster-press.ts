import type { Dispatch, SetStateAction } from 'react';
import { useRef, useState } from 'react';
import type { Lane, ScopedCacheIdentity, Window } from '../../core';
import { layoutLane, snapToStep, timeAtX } from '../../core';
import { hitTest } from '../../core/hit-test';
import type { RectActivation, RectTargetRef } from '../layers/layers.types';
import type { RosterInput, RosterModel, RosterProjection } from './roster.types';

export type SelectedInterval = NonNullable<RosterModel['selection']> & {
  target?: RectTargetRef;
};

// Isolate the stable press ref so it does not prevent compilation of derived roster values.
export function useRosterPress(
  input: RosterInput,
  window: Window,
  projection: RosterProjection,
  cacheIdentity: ScopedCacheIdentity,
  width: number,
  selection: RosterModel['selection'],
  setSelected: Dispatch<SetStateAction<SelectedInterval | null>>,
) {
  const currentPress = { input, window, projection, cacheIdentity, width, selection };
  const pressInput = useRef(currentPress);
  pressInput.current = currentPress;
  const [actions] = useState(() => {
    const activateInterval: RectActivation = (rect, lane, target) => {
      const { input, window, projection, selection } = pressInput.current;
      if (input.selectable) {
        const layer = lane.layers.find((layer) => layer.id === rect.layerId);
        if (layer === undefined) return;
        setSelected(
          selection?.lane.id === lane.id &&
            selection.rect.layerId === rect.layerId &&
            selection.rect.x === rect.x &&
            selection.rect.width === rect.width
            ? null
            : {
                rect,
                layer,
                lane,
                start: timeAtX(projection, window, rect.x),
                end: timeAtX(projection, window, rect.x + rect.width),
                target,
              },
        );
      }
      input.onIntervalPress?.(rect, lane);
    };
    const activateGap: RectActivation = (rect, lane) => {
      if (pressInput.current.selection) setSelected(null);
      pressInput.current.input.onGapPress?.(rect, lane);
    };
    function press(lane: Lane, pointX: number, pointY: number): void {
      const { input, window, projection, cacheIdentity, width, selection } = pressInput.current;
      const { minuteStep = 60, onCellPress } = input;
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
      const hit = hitTest(
        lane,
        layoutLane(lane, window, projection, cacheIdentity),
        pointX,
        pointY,
      );
      if (hit?.kind === 'interval') {
        activateInterval(hit.rect, lane);
        return;
      }
      if (hit?.kind === 'gap') {
        activateGap(hit.rect, lane);
        return;
      }
      if (selection) setSelected(null);
      const time = Math.max(
        window.start,
        snapToStep(timeAtX(projection, window, pointX), minuteStep, viewTimezone),
      );
      if (time < window.end) onCellPress?.(lane, time);
    }
    return { press, activateInterval, activateGap };
  });
  return actions;
}
