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
import type { Lane, Layer, Rect } from '../../../src/core';
import {
  byCoverage,
  clearCoverageCache,
  clearLayoutCache,
  coverageStats,
  layoutStats,
  next,
  resetStats,
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
