import type { LegendListRef } from '@legendapp/list';
import { useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import { makeMutable, useAnimatedStyle } from 'react-native-reanimated';
import type { Lane, LaneGeometry, Rect, ScopedCacheIdentity, Window } from '../../core';
import { byLabel, coverageFor, flagFor, layoutLane, timeAtX, windowFor, xAtTime } from '../../core';
import type { RosterInput, RosterModel, RosterProjection } from './roster.types';
import { type SelectedInterval, useRosterPress } from './use-roster-press';
import { ticksFor } from './utils/ticks';

export function useRoster(input: RosterInput): RosterModel {
  const {
    lanes,
    windowSpec,
    now = null,
    minuteStep = 60,
    sortLanes = byLabel,
    rowHeight = 48,
    pxPerMinute = 0.5,
    onNavigate,
  } = input;
  const [ownedCacheIdentity] = useState<ScopedCacheIdentity>(() => ({}));
  const cacheIdentity = input.cacheIdentity ?? ownedCacheIdentity;
  const [selected, setSelected] = useState<SelectedInterval | null>(null);
  function dismissSelection() {
    setSelected(null);
  }
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  // The pinned compiler lint cannot resolve useSharedValue's built-in type.
  // These shared values only track offsets, so no animation needs cancellation.
  const [x] = useState(() => makeMutable(0));
  const [y] = useState(() => makeMutable(0));
  const verticalRef = useRef<LegendListRef>(null);
  const bodyRef = useRef<ScrollView>(null);
  // Explicit dependencies: a web bundler that skips Reanimated's Babel plugin
  // for node_modules (Vite, Storybook) throws on a worklet without them.
  const headerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -x.get() }] }), [x]);
  const labelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -y.get() }] }), [y]);
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
  const nowLine =
    now !== null && now >= window.start && now < window.end
      ? { x: xAtTime(projection, window, now), now }
      : null;
  const contentWidth = duration * projection.pxPerMinute;
  const coverage = new Map(
    lanes.map((lane) => [lane.id, coverageFor(lane, window, cacheIdentity)]),
  );
  const orderedLanes = [...lanes].sort((a, b) => sortLanes(a, b, coverage));
  const laneState = new Map(
    lanes.map((lane) => [
      lane.id,
      { flag: flagFor(lane, window), complete: lane.complete ?? true },
    ]),
  );
  function geometryFor(lane: Lane): LaneGeometry {
    return layoutLane(lane, window, projection, cacheIdentity);
  }
  const selection = reconcileSelection(
    selected,
    lanes,
    window,
    projection,
    cacheIdentity,
    input.selectable ?? false,
  );
  // Discard invalid selection during reconciliation, before rendering any stale detail.
  if (selected && !selection) setSelected(null);
  const press = useRosterPress(
    input,
    window,
    projection,
    cacheIdentity,
    contentWidth,
    selection,
    setSelected,
  );
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
    now,
    nowLine,
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
      verticalRef,
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
  cacheIdentity: ScopedCacheIdentity,
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
      let nearest = 1;
      for (const candidate of layoutLane(lane, window, projection, cacheIdentity).rects) {
        if (candidate.layerId !== layer.id) continue;
        const identities = new Set(
          candidate.sources.map((source) => JSON.stringify([source.kind, source.id])),
        );
        if (identities.size !== sources.size || ![...identities].every((id) => sources.has(id)))
          continue;
        const difference =
          Math.abs(timeAtX(projection, window, candidate.x) - selected.start) +
          Math.abs(timeAtX(projection, window, candidate.x + candidate.width) - selected.end);
        if (difference <= nearest && (!rect || difference < nearest)) {
          nearest = difference;
          rect = candidate;
        }
      }
      if (rect) return { rect, layer, lane, start: selected.start, end: selected.end };
    }
  }
  return null;
}
