import { useContext, useRef, useState } from 'react';
import type { ScopedCacheIdentity } from '../../core';
import { dayColumnsFor, layoutLane, snapToStep, timeAtY, windowFor } from '../../core';
import { hitTest } from '../../core/hit-test';
import type { RectActivation } from '../layers/layers.types';
import type { ScheduleInput, ScheduleModel, ScheduleProjection } from './schedule.types';
import { ScheduleWidth } from './use-schedule-viewport';
import { projectWindowBand } from './utils/window-band';

export function useSchedule(input: ScheduleInput): ScheduleModel {
  const { lane, windowSpec, now = null, minuteStep = 60, pxPerHour = 48 } = input;
  const width = useContext(ScheduleWidth);
  const [ownedCacheIdentity] = useState<ScopedCacheIdentity>(() => ({}));
  const cacheIdentity = input.cacheIdentity ?? ownedCacheIdentity;
  if (!Number.isInteger(minuteStep) || minuteStep <= 0 || 60 % minuteStep !== 0)
    throw new RangeError('minuteStep must be a positive divisor of 60');
  if (!Number.isFinite(pxPerHour) || pxPerHour <= 0)
    throw new RangeError('pxPerHour must be a positive finite number');
  const window = windowFor(windowSpec);
  const days = dayColumnsFor(window, windowSpec.timezone);
  const projection: ScheduleProjection = {
    orientation: 'columns',
    viewTimezone: windowSpec.timezone,
    pxPerHour,
    columnWidth: width / Math.max(1, days.length),
    days,
  };
  const geometry = layoutLane(lane, window, projection, cacheIdentity);
  const windowBandPieces = input.bandWindow
    ? projectWindowBand(input.bandWindow, window, projection)
    : [];
  const currentPress = { input, window, projection, geometry };
  const pressInput = useRef(currentPress);
  pressInput.current = currentPress;
  const [actions] = useState(() => {
    const activateInterval: RectActivation = (rect, lane) => {
      pressInput.current.input.onIntervalPress?.(rect, lane);
    };
    const activateGap: RectActivation = (rect, lane) => {
      pressInput.current.input.onGapPress?.(rect, lane);
    };
    function press(columnIndex: number, x: number, y: number): void {
      const { input, window, projection, geometry } = pressInput.current;
      const { lane, minuteStep = 60, onCellPress } = input;
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x >= projection.columnWidth)
        return;
      const absolute = timeAtY(projection, columnIndex, y);
      if (absolute === null) return;
      const time = Math.max(
        window.start,
        snapToStep(absolute, minuteStep, projection.viewTimezone),
      );
      const hit = hitTest(
        lane,
        {
          ...geometry,
          rects: geometry.rects.filter((rect) => rect.column === columnIndex),
          gapRects: geometry.gapRects.filter((rect) => rect.column === columnIndex),
        },
        x,
        y,
      );
      if (hit?.kind === 'interval') {
        activateInterval(hit.rect, lane);
        return;
      }
      if (hit?.kind === 'gap') {
        activateGap(hit.rect, lane);
        return;
      }
      if (time < window.end) onCellPress?.(lane, time);
    }
    return { press, activateInterval, activateGap };
  });
  function boundsFor(rect: (typeof geometry.rects)[number]) {
    const column = rect.column;
    const day = column === undefined ? undefined : projection.days[column];
    if (!day || column === undefined) return window;
    const endY = rect.y + rect.height;
    const height = 24 * projection.pxPerHour;
    return {
      start: timeAtY(projection, column, rect.y) ?? day.start,
      end: endY >= height ? day.end : (timeAtY(projection, column, endY) ?? day.end),
    };
  }
  return {
    window,
    days,
    projection,
    geometry,
    now: now !== null && now >= window.start && now < window.end ? now : null,
    windowBandPieces,
    ...actions,
    boundsFor,
    status: 'ready',
  };
}
