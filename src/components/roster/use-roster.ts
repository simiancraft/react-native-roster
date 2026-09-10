import { useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import { makeMutable, useAnimatedStyle } from 'react-native-reanimated';
import type { Lane, LaneGeometry } from '../../core';
import {
  byLabel,
  coverageFor,
  flagFor,
  layoutLane,
  snapToStep,
  timeAtX,
  windowFor,
} from '../../core';
import { hitTest } from '../../core/hit-test';
import type { RosterInput, RosterModel, RosterProjection } from './roster.types';
import { ticksFor } from './utils/ticks';

export function useRoster(input: RosterInput): RosterModel {
  const {
    lanes,
    windowSpec,
    minuteStep = 60,
    sortLanes = byLabel,
    rowHeight = 48,
    pxPerMinute = 0.5,
    onNavigate,
  } = input;
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  // The pinned compiler lint cannot resolve useSharedValue's built-in type.
  // These shared values only track offsets, so no animation needs cancellation.
  const [x] = useState(() => makeMutable(0));
  const [y] = useState(() => makeMutable(0));
  const bodyRef = useRef<ScrollView>(null);
  const headerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -x.get() }] }));
  const labelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -y.get() }] }));
  const window = windowFor(windowSpec);
  if (
    !(rowHeight > 0) ||
    !Number.isFinite(rowHeight) ||
    !(pxPerMinute > 0) ||
    !Number.isFinite(pxPerMinute)
  )
    throw new RangeError('rowHeight and pxPerMinute must be positive finite numbers');
  const duration = (window.end - window.start) / 60_000;
  const projection: RosterProjection = {
    orientation: 'horizontal',
    viewTimezone: windowSpec.timezone,
    rowHeight,
    pxPerMinute: Math.max(pxPerMinute, duration === 0 ? 0 : viewport.width / duration),
  };
  const contentWidth = duration * projection.pxPerMinute;
  const coverage = new Map(lanes.map((lane) => [lane.id, coverageFor(lane, window)]));
  const orderedLanes = [...lanes].sort((a, b) => sortLanes(a, b, coverage));
  const laneState = new Map(
    lanes.map((lane) => [
      lane.id,
      { flag: flagFor(lane, window), complete: lane.complete ?? true },
    ]),
  );
  function geometryFor(lane: Lane): LaneGeometry {
    return layoutLane(lane, window, projection);
  }
  const currentPress = { input, window, projection, width: contentWidth };
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
  return {
    window,
    projection,
    orderedLanes,
    coverage,
    laneState,
    geometryFor,
    press,
    status: lanes.length === 0 ? 'empty' : 'ready',
    ticks: ticksFor(window, windowSpec, projection, minuteStep),
    contentWidth,
    viewport,
    navigate: (next) => onNavigate?.(next),
    onLayout: ({ nativeEvent: { layout } }) =>
      setViewport((previous) =>
        previous.width === layout.width && previous.height === layout.height
          ? previous
          : { width: layout.width, height: layout.height },
      ),
    scroll: {
      x,
      y,
      bodyRef,
      headerStyle,
      labelStyle,
      onBodyScroll: ({ nativeEvent }) => {
        x.set(nativeEvent.contentOffset.x);
      },
      onHeaderScroll: ({ nativeEvent }) => {
        x.set(nativeEvent.contentOffset.x);
        bodyRef.current?.scrollTo({ x: nativeEvent.contentOffset.x, animated: false });
      },
      onVerticalScroll: ({ nativeEvent }) => {
        y.set(nativeEvent.contentOffset.y);
      },
    },
  };
}
