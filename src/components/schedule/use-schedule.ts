import { useContext, useEffect, useState } from 'react';
import { dayColumnsFor, layoutLane, snapToStep, timeAtY, windowFor } from '../../core';
import { hitTest } from '../roster/utils/hit-test';
import type { ScheduleInput, ScheduleModel, ScheduleProjection } from './schedule.types';
import { ScheduleWidth } from './use-schedule-viewport';

export function useSchedule(input: ScheduleInput): ScheduleModel {
  const {
    lane,
    windowSpec,
    minuteStep = 60,
    pxPerHour = 48,
    onIntervalPress,
    onGapPress,
    onCellPress,
  } = input;
  const width = useContext(ScheduleWidth);
  const [clock, setClock] = useState(Date.now);
  // The current-time indicator follows the wall clock for the mounted surface's lifetime.
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
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
  const geometry = layoutLane(lane, window, projection);
  function press(columnIndex: number, x: number, y: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x >= projection.columnWidth) return;
    const absolute = timeAtY(projection, columnIndex, y);
    if (absolute === null) return;
    const time = snapToStep(absolute, minuteStep, windowSpec.timezone);
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
      onIntervalPress?.(hit.rect, lane);
      return;
    }
    if (hit?.kind === 'gap') {
      onGapPress?.(hit.rect, lane);
      return;
    }
    onCellPress?.(lane, Math.max(window.start, time));
  }
  return {
    window,
    days,
    projection,
    geometry,
    now: clock >= window.start && clock < window.end ? clock : null,
    press,
    status: 'ready',
  };
}
