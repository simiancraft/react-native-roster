import { useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import { makeMutable, useAnimatedStyle } from 'react-native-reanimated';
import type { Lane, LaneGeometry, Rect, Window } from '../../core';
import { byLabel, coverageFor, flagFor, layoutLane, timeAtX, windowFor } from '../../core';
import type { RosterInput, RosterModel, RosterProjection } from './roster.types';
import { type SelectedInterval, useRosterPress } from './use-roster-press';
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
  const [selected, setSelected] = useState<SelectedInterval | null>(null);
  const [dismissSelection] = useState(() => () => setSelected(null));
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
  const selection = reconcileSelection(
    selected,
    lanes,
    window,
    projection,
    !!input.intervalDetailComponent,
  );
  // Discard invalid selection during reconciliation, before rendering any stale detail.
  if (selected && !selection) setSelected(null);
  const press = useRosterPress(input, window, projection, contentWidth, setSelected);
  return {
    selection,
    dismissSelection,
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

// Match provenance and nearest bounds while preserving the stored display values.
function reconcileSelection(
  selected: SelectedInterval | null,
  lanes: Lane[],
  window: Window,
  projection: RosterProjection,
  enabled: boolean,
): RosterModel['selection'] {
  if (selected && enabled) {
    const lane = lanes.find((lane) => lane.id === selected.lane.id);
    const layer = lane?.layers.find((layer) => layer.id === selected.layer.id);
    if (lane && layer) {
      const sources = new Set(
        selected.rect.sources.map((source) => JSON.stringify([source.kind, source.id])),
      );
      let rect: Rect | undefined;
      let nearest = Math.max(1, 60_000 / projection.pxPerMinute);
      for (const candidate of layoutLane(lane, window, projection).rects) {
        if (candidate.layerId !== layer.id) continue;
        const identities = new Set(
          candidate.sources.map((source) => JSON.stringify([source.kind, source.id])),
        );
        if (identities.size !== sources.size || ![...identities].every((id) => sources.has(id)))
          continue;
        const difference =
          Math.abs(timeAtX(projection, window, candidate.x) - selected.start) +
          Math.abs(timeAtX(projection, window, candidate.x + candidate.width) - selected.end);
        if (difference < nearest) {
          nearest = difference;
          rect = candidate;
        }
      }
      if (rect) return { rect, layer, lane, start: selected.start, end: selected.end };
    }
  }
  return null;
}
