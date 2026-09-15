import '../../support/native-host';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createElement } from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { RosterInput, RosterModel } from '../../../src/components/roster/roster.types';
import { useRoster } from '../../../src/components/roster/use-roster';
import type { Interval, Lane, Layer, Rect } from '../../../src/core';
import {
  byCoverage,
  clearCoverageCache,
  clearLayoutCache,
  coverageStats,
  layoutStats,
  next,
  resetStats,
  timeAtX,
} from '../../../src/core';
import { rosterFixtures, rosterWindowSpec } from '../../fixtures/roster';
import { workload } from '../../fixtures/workload';

function harness(input: RosterInput) {
  let model: RosterModel;
  let tree: ReactTestRenderer;
  function Hook({ value }: { value: RosterInput }) {
    model = useRoster(value);
    return null;
  }
  act(() => {
    tree = create(createElement(Hook, { value: input }));
  });
  return {
    get model() {
      return model;
    },
    update(value: RosterInput) {
      act(() => tree.update(createElement(Hook, { value })));
    },
    close() {
      act(() => tree.unmount());
    },
  };
}
function scrollInput(x: number, y = 0) {
  return { nativeEvent: { contentOffset: { x, y } } } as NativeSyntheticEvent<NativeScrollEvent>;
}
function layoutInput(width: number, height: number) {
  return { nativeEvent: { layout: { width, height } } } as LayoutChangeEvent;
}
function show(model: RosterModel, first: number, last: number) {
  for (const lane of model.orderedLanes.slice(first, last + 1)) model.geometryFor(lane);
}

beforeEach(() => {
  clearLayoutCache();
  clearCoverageCache();
  resetStats();
});

describe('useRoster hook without native rendering', () => {
  it('derives nowLine from elapsed time and the fitted projection with exclusive end bounds', () => {
    const input = { lanes: rosterFixtures['single-lane'].lanes, windowSpec: rosterWindowSpec };
    const h = harness(input);
    expect(h.model.now).toBeNull();
    expect(h.model.nowLine).toBeNull();
    const { start, end } = h.model.window;
    for (const now of [null, start - 1, end, end + 1]) {
      h.update({ ...input, now });
      expect(h.model.now).toBe(now);
      expect(h.model.nowLine).toBeNull();
    }
    h.update({ ...input, now: start });
    expect(h.model.nowLine).toEqual({ x: 0, now: start });
    h.update({ ...input, now: start + 90 * 60_000 });
    expect(h.model.nowLine).toEqual({ x: 45, now: start + 90 * 60_000 });
    h.update({ ...input, now: start + 90 * 60_000, pxPerMinute: 2 });
    expect(h.model.nowLine).toEqual({ x: 180, now: start + 90 * 60_000 });
    act(() => h.model.onLayout(layoutInput(40_320, 480)));
    expect(h.model.nowLine).toEqual({ x: 360, now: start + 90 * 60_000 });
    h.update({
      ...input,
      now: start,
      windowSpec: { span: 'custom', timezone: 'UTC', window: { start, end: start } },
    });
    expect(h.model.nowLine).toBeNull();
    h.close();
  });
  it('covers every lane before sorting and computes geometry only for requested mounted lanes', () => {
    const lanes = workload().lanes;
    const sortLanes = mock((a: Lane, b: Lane, coverage: RosterModel['coverage']) => {
      expect(coverage.size).toBe(200);
      return a.label.localeCompare(b.label);
    });
    const h = harness({ lanes, windowSpec: rosterWindowSpec, sortLanes });
    expect(h.model.status).toBe('ready');
    expect(coverageStats().runs).toBe(200);
    expect(layoutStats().runs).toBe(0);
    show(h.model, 0, 23);
    expect(layoutStats().runs).toBe(24);
    const lane = h.model.orderedLanes[0] as Lane;
    const geometry = h.model.geometryFor(lane);
    expect(geometry.rects.length + geometry.gapRects.length).toBe(70);
    show(h.model, 0, 23);
    expect(h.model.geometryFor(lane)).toBe(geometry);
    h.update({
      lanes,
      windowSpec: rosterWindowSpec,
      minuteStep: 15,
      sortLanes,
      highlightSource: { kind: 'rule', id: '0:a' },
    });
    expect(h.model.geometryFor(lane).rects).toBe(geometry.rects);
    expect(layoutStats().runs).toBe(24);
    show(h.model, 24, 47);
    expect(layoutStats().runs).toBe(48);
    show(h.model, 0, 23);
    expect(layoutStats().runs).toBe(48);
    h.close();
  });
  it('tracks empty status, flags, completeness, and navigation', () => {
    const onNavigate = mock();
    const h = harness({
      lanes: rosterFixtures['never-set'].lanes,
      windowSpec: rosterWindowSpec,
      onNavigate,
    });
    expect(h.model.laneState.get('never')).toEqual({ flag: 'never-set', complete: true });
    expect(h.model.laneState.get('outside')?.flag).toBe('empty-in-window');
    expect(h.model.laneState.get('incomplete')?.complete).toBe(false);
    h.model.navigate(next(rosterWindowSpec));
    expect(onNavigate).toHaveBeenCalledWith(next(rosterWindowSpec));
    show(h.model, 0, 1);
    h.update({ lanes: [], windowSpec: rosterWindowSpec });
    h.model.navigate(rosterWindowSpec);
    expect(h.model.status).toBe('empty');
    h.close();
  });
  it('keeps scrolling outside React state and recomputes projection on measured resize', () => {
    const h = harness({ lanes: rosterFixtures['single-lane'].lanes, windowSpec: rosterWindowSpec });
    const original = h.model;
    act(() => {
      h.model.scroll.onBodyScroll(scrollInput(120));
      h.model.scroll.onVerticalScroll(scrollInput(0, 96));
    });
    expect(h.model).toBe(original);
    expect(h.model.scroll.x.get()).toBe(120);
    expect(h.model.scroll.y.get()).toBe(96);
    h.model.scroll.onHeaderScroll(scrollInput(30));
    const scrollTo = mock();
    h.model.scroll.bodyRef.current = { scrollTo } as unknown as ScrollView;
    h.model.scroll.onHeaderScroll(scrollInput(90));
    expect(scrollTo).toHaveBeenCalledWith({ x: 90, animated: false });
    act(() => h.model.onLayout(layoutInput(20_160, 480)));
    expect(h.model.projection.pxPerMinute).toBe(2);
    expect(h.model.scroll.headerStyle).toEqual({ transform: [{ translateX: -90 }] });
    expect(h.model.scroll.labelStyle).toEqual({ transform: [{ translateY: -96 }] });
    const measured = h.model;
    act(() => h.model.onLayout(layoutInput(20_160, 480)));
    expect(h.model.viewport).toBe(measured.viewport);
    h.close();
  });
  it('keeps cached rects for labels, flags, steps, and highlight; invalidates changed windows and scale', () => {
    const lane = rosterFixtures['single-lane'].lanes[0] as Lane;
    const input: RosterInput = { lanes: [lane], windowSpec: rosterWindowSpec };
    const h = harness(input);
    show(h.model, 0, 0);
    const rects = h.model.geometryFor(lane).rects;
    h.update({
      ...input,
      lanes: [{ ...lane, label: 'Changed', flag: 'never-set', complete: false }],
      minuteStep: 30,
    });
    expect(h.model.geometryFor(lane).rects).toBe(rects);
    expect(h.model.laneState.get(lane.id)).toEqual({ flag: 'never-set', complete: false });
    h.update({ ...input, windowSpec: next(rosterWindowSpec) });
    h.model.geometryFor(lane);
    expect(layoutStats().runs).toBe(2);
    h.update(input);
    expect(h.model.geometryFor(lane).rects).toBe(rects);
    h.update({ ...input, rowHeight: 64 });
    h.model.geometryFor(lane);
    expect(layoutStats().runs).toBe(3);
    h.update({ ...input, windowSpec: { ...rosterWindowSpec, timezone: 'Pacific/Auckland' } });
    h.model.geometryFor(lane);
    expect(layoutStats().runs).toBe(4);
    h.close();
  });
  it('resolves interval priority, equal-z ties, final inset, gaps, and snapped empty space exactly once', () => {
    const base = rosterFixtures['two-layers'].lanes[0] as Lane;
    const start = Date.UTC(2024, 0, 1);
    const lane: Lane = {
      ...base,
      layers: [
        ...base.layers,
        { ...(base.layers[1] as Layer), id: 'later' },
        {
          id: 'gap',
          role: 'custom',
          z: 99,
          style: { color: '#000' },
          intervals: [],
          gaps: [
            { start, end: start + 24 * 3_600_000, sources: [{ kind: 'date', id: 'excluded' }] },
          ],
        },
      ],
    };
    const interval = mock((_rect: Rect, _lane: Lane) => {});
    const gap = mock((_rect: Rect, _lane: Lane) => {});
    const cell = mock((_lane: Lane, _time: number) => {});
    const input: RosterInput = {
      lanes: [lane],
      windowSpec: rosterWindowSpec,
      pxPerMinute: 1,
      minuteStep: 30,
      onIntervalPress: interval,
      onGapPress: gap,
      onCellPress: cell,
    };
    const h = harness(input);
    h.model.press(lane, 12 * 60, 10);
    expect(interval.mock.calls[0]?.[0].layerId).toBe('later');
    expect(gap).not.toHaveBeenCalled();
    expect(cell).not.toHaveBeenCalled();
    h.model.press(lane, 12 * 60, 0);
    expect(interval.mock.calls[1]?.[0].layerId).toBe('open');
    h.model.press(lane, 13 * 60, 10);
    expect(interval.mock.calls[2]?.[0].layerId).toBe('open');
    h.model.press(lane, 60, 10);
    expect(gap.mock.calls[0]?.[0].sources).toEqual([{ kind: 'date', id: 'excluded' }]);
    h.model.press(lane, 24 * 60 + 47, 10);
    expect(cell).toHaveBeenCalledWith(lane, start + (24 * 60 + 30) * 60_000);
    for (const [x, y] of [
      [-1, 0],
      [0, -1],
      [0, 48],
      [10_080, 0],
      [NaN, 1],
      [1, Infinity],
    ])
      h.model.press(lane, x as number, y as number);
    expect(interval).toHaveBeenCalledTimes(3);
    expect(gap).toHaveBeenCalledTimes(1);
    expect(cell).toHaveBeenCalledTimes(1);
    h.update({ lanes: [lane], windowSpec: rosterWindowSpec, pxPerMinute: 1 });
    h.model.press(lane, 720, 10);
    h.model.press(lane, 60, 10);
    h.model.press(lane, 2000, 10);
    h.update({ ...input, sortLanes: byCoverage({ measure: 'availability' }) });
    expect(h.model.orderedLanes).toEqual([lane]);
    h.close();
  });
  it('keeps the skipped Apia day empty and never fires a cell press', () => {
    const lane: Lane = { id: 'empty', label: 'Empty', layers: [] };
    const cell = mock();
    const h = harness({
      lanes: [lane],
      windowSpec: { span: 'day', anchorDate: '2011-12-30', timezone: 'Pacific/Apia' },
      onCellPress: cell,
    });
    act(() => h.model.onLayout(layoutInput(800, 48)));
    h.model.press(lane, 400, 20);
    expect(cell).not.toHaveBeenCalled();
    expect(h.model.window.start).toBe(h.model.window.end);
    expect(h.model.contentWidth).toBe(0);
    expect(Number.isFinite(h.model.projection.pxPerMinute)).toBe(true);
    expect(h.model.geometryFor(lane).rects).toEqual([]);
    h.close();
  });
  it('scales a sub-minute window exactly and keeps cell times within its bounds', () => {
    const window = {
      start: Date.parse('2024-01-01T00:00:59.990Z'),
      end: Date.parse('2024-01-01T00:01:00.000Z'),
    };
    const lane: Lane = { id: 'empty', label: 'Empty', layers: [] };
    const cell = mock();
    const h = harness({
      lanes: [lane],
      windowSpec: { span: 'custom', timezone: 'UTC', window },
      minuteStep: 1,
      onCellPress: cell,
    });
    act(() => h.model.onLayout(layoutInput(800, 48)));
    h.model.press(lane, 400, 20);
    expect(cell).toHaveBeenCalledWith(lane, window.start);
    expect(h.model.contentWidth).toBe(800);
    expect(h.model.projection.pxPerMinute).toBe(4_800_000);
    const covered: Lane = {
      ...lane,
      layers: [
        {
          id: 'whole',
          role: 'custom',
          z: 0,
          style: { color: 'green' },
          intervals: [{ ...window, sources: [] }],
        },
      ],
    };
    expect(h.model.geometryFor(covered).rects[0]).toMatchObject({ x: 0, width: 800 });
    // Floating-point inversion can round a point just inside the edge to window.end.
    h.model.press(lane, 800 - Number.EPSILON * 800, 20);
    h.model.press(lane, 800, 20);
    expect(cell).toHaveBeenCalledTimes(1);
    h.close();
  });
  it('rejects invalid dimensions', () => {
    for (const options of [
      { rowHeight: 0 },
      { rowHeight: Infinity },
      { pxPerMinute: 0 },
      { pxPerMinute: Infinity },
    ])
      expect(() => harness({ lanes: [], windowSpec: rosterWindowSpec, ...options })).toThrow(
        'positive finite',
      );
  });
});

it('selects only with detail content, dismisses, reconciles current data, and clears removed bounds', () => {
  const lane = rosterFixtures['single-lane'].lanes[0] as Lane;
  const onIntervalPress = mock();
  const input: RosterInput = { lanes: [lane], windowSpec: rosterWindowSpec, onIntervalPress };
  const h = harness(input);
  const press = h.model.press;
  act(() => press(lane, 300, 10));
  expect(h.model.selection).toBeNull();
  const enabled = { ...input, intervalDetailComponent: () => null };
  h.update(enabled);
  act(() => press(lane, 300, 10));
  const rect = h.model.geometryFor(lane).rects[0] as Rect;
  expect(h.model.selection).toEqual({
    lane,
    layer: lane.layers[0] as Layer,
    rect,
    start: timeAtX(h.model.projection, h.model.window, rect.x),
    end: timeAtX(h.model.projection, h.model.window, rect.x + rect.width),
  });
  expect(onIntervalPress).toHaveBeenCalledTimes(2);
  const fresh = {
    ...lane,
    label: 'Fresh label',
    layers: lane.layers.map((layer) => ({ ...layer, label: 'Fresh layer' })),
  };
  h.update({ ...enabled, lanes: [fresh] });
  expect(h.model.selection?.lane).toBe(fresh);
  expect(h.model.selection?.layer).toBe(fresh.layers[0]);
  act(() => h.model.onLayout(layoutInput(20_160, 480)));
  expect(h.model.selection?.rect).toBe(h.model.geometryFor(fresh).rects[0] as Rect);
  expect(h.model.press).toBe(press);
  act(() => h.model.dismissSelection());
  expect(h.model.selection).toBeNull();
  act(() => press(fresh, 1200, 10));
  h.update({ ...enabled, lanes: [] });
  expect(h.model.selection).toBeNull();
  h.update(enabled);
  expect(h.model.selection).toBeNull();
  act(() => press(lane, 1200, 10));
  h.update({ ...enabled, lanes: [{ ...lane, layers: [] }] });
  expect(h.model.selection).toBeNull();
  h.update(enabled);
  act(() => press(lane, 1200, 10));
  h.update({ ...enabled, windowSpec: next(rosterWindowSpec) });
  expect(h.model.selection).toBeNull();
  h.update(enabled);
  act(() => press(lane, 1200, 10));
  h.update(input);
  expect(h.model.selection).toBeNull();
  h.close();
});

it('toggles intervals, switches lanes, and dismisses on cells and gaps with callbacks', () => {
  const lane = rosterFixtures['single-lane'].lanes[0] as Lane;
  const other = { ...lane, id: 'other' };
  const gapLane = rosterFixtures['full-day-gap'].lanes[0] as Lane;
  const onIntervalPress = mock();
  const onCellPress = mock();
  const onGapPress = mock();
  const h = harness({
    lanes: [lane, other, gapLane],
    windowSpec: rosterWindowSpec,
    intervalDetailComponent: () => null,
    onIntervalPress,
    onCellPress,
    onGapPress,
  });
  const press = h.model.press;
  act(() => press(lane, 300, 10));
  clearLayoutCache();
  act(() => press(lane, 310, 10));
  expect(h.model.selection).toBeNull();
  expect(onIntervalPress).toHaveBeenCalledTimes(2);
  act(() => press(lane, 300, 10));
  act(() => press(other, 300, 10));
  expect(h.model.selection?.lane).toBe(other);
  act(() => press(other, 10, 10));
  expect(h.model.selection).toBeNull();
  expect(onCellPress).toHaveBeenCalledWith(other, h.model.window.start);
  act(() => press(lane, 300, 10));
  act(() => press(gapLane, 10, 10));
  expect(h.model.selection).toBeNull();
  expect(onGapPress).toHaveBeenCalledWith(h.model.geometryFor(gapLane).gapRects[0], gapLane);
  act(() => press(lane, 300, 10));
  act(() => h.model.onLayout(layoutInput(20_161, 480)));
  const rect = h.model.geometryFor(lane).rects[0] as Rect;
  act(() => press(lane, rect.x + 1, rect.y + 1));
  expect(h.model.selection).toBeNull();
  expect(h.model.press).toBe(press);
  h.close();
});

it('switches between intervals in the same lane and between overlapping layers', () => {
  const base = rosterFixtures['single-lane'].lanes[0] as Lane;
  const layer = base.layers[0] as Layer;
  const interval = layer.intervals[0] as Interval;
  const lane = {
    ...base,
    layers: [
      {
        ...layer,
        intervals: [
          interval,
          {
            ...interval,
            start: interval.end,
            end: interval.end + 3_600_000,
            sources: [{ kind: 'rule', id: 'second' }],
          },
        ],
      },
      {
        ...layer,
        id: 'overlay',
        z: 1,
        intervals: [
          { ...interval, start: interval.start + 3_600_000, end: interval.end - 3_600_000 },
        ],
      },
    ],
  };
  const h = harness({
    lanes: [lane],
    windowSpec: rosterWindowSpec,
    intervalDetailComponent: () => null,
  });
  act(() => h.model.press(lane, 275, 10));
  expect(h.model.selection?.layer.id).toBe(layer.id);
  act(() => h.model.press(lane, 520, 10));
  expect(h.model.selection?.start).toBe(interval.end);
  act(() => h.model.press(lane, 305, 10));
  expect(h.model.selection?.layer.id).toBe('overlay');
  h.close();
});

it('retains selection when a fitted resize introduces sub-millisecond projection roundoff', () => {
  const lane: Lane = {
    id: 'resize',
    label: 'Resize',
    layers: [
      {
        id: 'open',
        role: 'availability',
        z: 0,
        style: { color: 'green' },
        intervals: [{ start: 32_400_000, end: 61_200_000, sources: [] }],
      },
    ],
  };
  const h = harness({
    lanes: [lane],
    windowSpec: { span: 'day', anchorDate: '1970-01-01', timezone: 'UTC' },
    intervalDetailComponent: () => null,
  });
  act(() => h.model.press(lane, 300, 10));
  expect(h.model.selection).toMatchObject({ start: 32_400_000, end: 61_200_000 });
  act(() => h.model.onLayout(layoutInput(721, 480)));
  const rect = h.model.geometryFor(lane).rects[0] as Rect;
  expect(Number.isInteger(h.model.projection.pxPerMinute)).toBe(false);
  expect(timeAtX(h.model.projection, h.model.window, rect.x + rect.width)).not.toBe(61_200_000);
  expect(h.model.selection).toMatchObject({ start: 32_400_000, end: 61_200_000 });
  expect(h.model.selection?.rect).toBe(rect);
  // Selection captured at a fractional scale also survives returning to the original scale.
  act(() => h.model.dismissSelection());
  act(() => h.model.press(lane, 300, 10));
  act(() => h.model.onLayout(layoutInput(720, 480)));
  expect(h.model.selection).not.toBeNull();
  expect(h.model.selection?.rect).toBe(h.model.geometryFor(lane).rects[0] as Rect);
  h.close();
});

it('selects the correct adjacent sub-millisecond interval despite rounded bounds colliding', () => {
  const lane: Lane = {
    id: 'fractional',
    label: 'Fractional',
    layers: [
      {
        id: 'open',
        role: 'custom',
        z: 0,
        style: { color: 'green' },
        intervals: [
          { start: 1000.1, end: 1000.2, sources: [{ kind: 'rule', id: 'first' }] },
          { start: 1000.2, end: 1000.3, sources: [{ kind: 'rule', id: 'second' }] },
        ],
      },
    ],
  };
  const h = harness({
    lanes: [lane],
    windowSpec: { span: 'custom', timezone: 'UTC', window: { start: 1000, end: 1001 } },
    intervalDetailComponent: () => null,
  });
  act(() => h.model.onLayout(layoutInput(720, 480)));
  const rect = h.model.geometryFor(lane).rects[1] as Rect;
  act(() => h.model.press(lane, rect.x + rect.width / 2, 10));
  expect(h.model.selection?.rect).toBe(rect);
  expect(h.model.selection).toMatchObject({ start: 1000.2, end: 1000.3 });
  h.close();
});

it('retains stored half-millisecond bounds when resizing to 721 px', () => {
  const lane: Lane = {
    id: 'half',
    label: 'Half',
    layers: [
      {
        id: 'open',
        role: 'custom',
        z: 0,
        style: { color: 'green' },
        intervals: [{ start: 6.5, end: 60_000, sources: [] }],
      },
    ],
  };
  const h = harness({
    lanes: [lane],
    windowSpec: { span: 'day', anchorDate: '1970-01-01', timezone: 'UTC' },
    intervalDetailComponent: () => null,
  });
  act(() => h.model.press(lane, 0.25, 10));
  expect(h.model.selection).toMatchObject({ start: 6.5, end: 60_000 });
  act(() => h.model.onLayout(layoutInput(721, 480)));
  const rect = h.model.geometryFor(lane).rects[0] as Rect;
  expect(timeAtX(h.model.projection, h.model.window, rect.x)).toBe(6.499999999999999);
  expect(h.model.selection?.rect).toBe(rect);
  expect(h.model.selection).toMatchObject({ start: 6.5, end: 60_000 });
  h.close();
});

it('chooses nearest neighboring bounds for repeated source sets and rejects changed identity or distant bounds', () => {
  const sources = [
    { kind: 'rule', id: 'weekly' },
    { kind: 'date', id: 'include' },
  ];
  const lane: Lane = {
    id: 'repeated',
    label: 'Repeated',
    layers: [
      {
        id: 'open',
        role: 'custom',
        z: 0,
        style: { color: 'green' },
        // A small gap keeps identical source spans from merging into one rect.
        intervals: [
          { start: 1000.1, end: 1000.19, sources },
          { start: 1000.2, end: 1000.3, sources },
        ],
      },
      {
        id: 'other',
        role: 'custom',
        z: -1,
        style: { color: 'blue' },
        intervals: [{ start: 1000.2, end: 1000.3, sources }],
      },
    ],
  };
  const input: RosterInput = {
    lanes: [lane],
    windowSpec: { span: 'custom', timezone: 'UTC', window: { start: 1000, end: 1010 } },
    intervalDetailComponent: () => null,
  };
  const h = harness(input);
  act(() => h.model.onLayout(layoutInput(720, 480)));
  const rect = h.model.geometryFor(lane).rects[1] as Rect;
  act(() => h.model.press(lane, rect.x + rect.width / 2, 10));
  expect(h.model.selection?.rect).toBe(rect);
  const stored = h.model.selection;
  const fresh: Lane = {
    ...lane,
    layers: lane.layers.map((layer) => ({
      ...layer,
      intervals: layer.intervals.map((interval) => ({
        ...interval,
        sources: [...sources].reverse().map((source) => ({ ...source, label: 'Fresh' })),
      })),
    })),
  };
  h.update({ ...input, lanes: [fresh] });
  act(() => h.model.onLayout(layoutInput(721, 480)));
  expect(h.model.selection?.rect).toBe(h.model.geometryFor(fresh).rects[1] as Rect);
  expect(h.model.selection).toMatchObject({ start: stored?.start, end: stored?.end });
  for (const replacement of [
    [
      { kind: 'date', id: 'weekly' },
      { kind: 'date', id: 'include' },
    ],
    [{ kind: 'rule', id: 'weekly' }],
    [
      { kind: 'rule', id: 'different' },
      { kind: 'date', id: 'include' },
    ],
  ]) {
    h.update(input);
    act(() => h.model.press(lane, rect.x + rect.width / 2, 10));
    h.update({
      ...input,
      lanes: [
        {
          ...lane,
          layers: lane.layers.map((layer) => ({
            ...layer,
            intervals: layer.intervals.map((interval) => ({ ...interval, sources: replacement })),
          })),
        },
      ],
    });
    expect(h.model.selection).toBeNull();
  }
  h.update(input);
  act(() => h.model.press(lane, rect.x + rect.width / 2, 10));
  h.update({
    ...input,
    lanes: [
      {
        ...lane,
        layers: lane.layers.map((layer) => ({
          ...layer,
          intervals: layer.intervals.map((interval) => ({
            ...interval,
            start: interval.start + 2,
            end: interval.end + 2,
          })),
        })),
      },
    ],
  });
  expect(h.model.selection).toBeNull();
  h.close();
});
