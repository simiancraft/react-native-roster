import './render-host.test';
import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useRoster } from '../src/components/roster/use-roster';
import type {
  ScheduleInput,
  ScheduleModel,
  ScheduleWindowSpec,
} from '../src/components/schedule/schedule.types';
import { useSchedule } from '../src/components/schedule/use-schedule';
import type { Lane, Layer, Rect } from '../src/core';
import {
  clearCoverageCache,
  clearLayoutCache,
  coverageStats,
  layoutStats,
  resetStats,
  timeAtY,
} from '../src/core';
import { clearExpandCache, expandStats, resetExpandStats } from '../src/rrule';
import { type ScheduleFixtureId, scheduleFixtures, scheduleLane } from './fixtures/schedule';

const trees: ReactTestRenderer[] = [];
function harness(input: ScheduleInput) {
  let model!: ScheduleModel;
  let tree!: ReactTestRenderer;
  function Hook({ value }: { value: ScheduleInput }) {
    model = useSchedule(value);
    return null;
  }
  act(() => {
    tree = create(createElement(Hook, { value: input }));
  });
  trees.push(tree);
  return {
    get model() {
      return model;
    },
    update(value: ScheduleInput) {
      act(() => tree.update(createElement(Hook, { value })));
    },
  };
}
function inputFor(id: ScheduleFixtureId): ScheduleInput {
  const windowSpec = scheduleFixtures[id].windowSpec;
  return { lane: scheduleLane(id, windowSpec), windowSpec };
}
function callbacks() {
  return {
    onIntervalPress: mock((_rect: Rect, _lane: Lane) => {}),
    onGapPress: mock((_rect: Rect, _lane: Lane) => {}),
    onCellPress: mock((_lane: Lane, _time: number) => {}),
  };
}

beforeEach(() => {
  clearLayoutCache();
  clearCoverageCache();
  resetStats();
  clearExpandCache();
  resetExpandStats();
});
afterEach(() => {
  for (const tree of trees.splice(0)) act(() => tree.unmount());
  mock.restore();
});

describe('useSchedule hook harness', () => {
  it('returns the exact contract for one lane, including an empty ready week and rejected spans', () => {
    const input = inputFor('schedule-empty');
    const h = harness(input);
    expect(Object.keys(h.model).sort()).toEqual(
      ['window', 'days', 'projection', 'geometry', 'now', 'press', 'status'].sort(),
    );
    expect(h.model.status).toBe('ready');
    expect(h.model.days).toHaveLength(7);
    expect(h.model.geometry.rects).toEqual([]);
    expect(h.model.now).toBeNull();
    expect(h.model.projection.orientation).toBe('columns');
    h.update({ ...input, windowSpec: { ...input.windowSpec, span: 'day' } });
    expect(h.model.days).toHaveLength(1);
    // @ts-expect-error Schedule rejects month at the public type boundary.
    const month: ScheduleWindowSpec = { span: 'month', anchorDate: '2024-01-01', timezone: 'UTC' };
    // @ts-expect-error Schedule rejects custom windows at the public type boundary.
    const custom: ScheduleWindowSpec = { span: 'custom', window: h.model.window, timezone: 'UTC' };
    expect(String(month.span)).toBe('month');
    expect(String(custom.span)).toBe('custom');
  });
  it('reports a 10:30 session at a 60-minute step, inset edges, and a full-day exclusion exactly once', () => {
    const input = inputFor('schedule-layers');
    const cb = callbacks();
    const h = harness({ ...input, ...cb });
    const rect = h.model.geometry.rects.find((rect) => rect.layerId === 'sessions') as Rect;
    expect(rect.y).toBe(10.5 * 48);
    expect(rect.width).toBe(h.model.projection.columnWidth - 8);
    h.model.press(0, rect.x + 1, rect.y + 1);
    expect(cb.onIntervalPress).toHaveBeenCalledWith(rect, input.lane);
    expect(rect.sources).toEqual([{ kind: 'session', id: '1' }]);
    expect(cb.onGapPress).not.toHaveBeenCalled();
    expect(cb.onCellPress).not.toHaveBeenCalled();
    h.model.press(0, 0, rect.y + 1);
    expect(cb.onGapPress.mock.calls[0]?.[0].sources).toEqual([
      { kind: 'date', id: 'session-1-gap' },
    ]);
    h.model.press(0, 1, rect.y - 1);
    expect(cb.onIntervalPress.mock.calls[1]?.[0].sources).toEqual([
      { kind: 'rule', id: 'morning' },
      { kind: 'rule', id: 'afternoon' },
    ]);
    const excluded = inputFor('schedule-excluded');
    h.update({ ...excluded, ...cb });
    h.model.press(1, 1, 12 * 48);
    expect(cb.onGapPress.mock.calls[1]?.[0].sources).toEqual([
      { kind: 'date', id: 'closed', label: 'Full-day exclusion' },
    ]);
    expect(cb.onCellPress).not.toHaveBeenCalled();
    h.update(input);
    h.model.press(0, rect.x + 1, rect.y + 1);
    h.model.press(0, 0, rect.y + 1);
    h.model.press(0, 1, 0);
  });
  it('keeps retained presses current after step, callback, lane, and projection changes', () => {
    const input = inputFor('schedule-layers');
    const previous = callbacks();
    const next = callbacks();
    const h = harness({ ...input, ...previous, minuteStep: 60 });
    const press = h.model.press;
    press(0, 1, (47 / 60) * 48);
    expect(previous.onCellPress).toHaveBeenLastCalledWith(input.lane, Date.UTC(2024, 0, 1));
    h.update({ ...input, ...next, minuteStep: 15 });
    expect(h.model.press).toBe(press);
    press(0, 1, (47 / 60) * 48);
    press(0, 5, 10.75 * 48);
    press(0, 0, 10.75 * 48);
    expect(next.onCellPress).toHaveBeenLastCalledWith(input.lane, Date.UTC(2024, 0, 1, 0, 45));
    expect(next.onIntervalPress).toHaveBeenCalledTimes(1);
    expect(next.onGapPress).toHaveBeenCalledTimes(1);
    expect(previous.onCellPress).toHaveBeenCalledTimes(1);
    expect(previous.onIntervalPress).not.toHaveBeenCalled();
    expect(previous.onGapPress).not.toHaveBeenCalled();
    const empty = inputFor('schedule-empty');
    const windowSpec = { ...empty.windowSpec, anchorDate: '2024-01-08' };
    h.update({ ...empty, windowSpec, ...next, minuteStep: 15, pxPerHour: 60 });
    expect(h.model.press).toBe(press);
    press(0, 1, 47);
    expect(next.onCellPress).toHaveBeenLastCalledWith(empty.lane, Date.UTC(2024, 0, 8, 0, 45));
  });
  it('selects midnight-crossing rects by column with identical sources', () => {
    const input = inputFor('schedule-midnight');
    const cb = callbacks();
    const h = harness({ ...input, ...cb });
    h.model.press(0, 1, 23.75 * 48);
    h.model.press(1, 1, 0.5 * 48);
    expect(cb.onIntervalPress.mock.calls.map(([rect]) => rect.column)).toEqual([0, 1]);
    expect(cb.onIntervalPress.mock.calls.map(([rect]) => rect.sources)).toEqual([
      [{ kind: 'date', id: 'midnight' }],
      [{ kind: 'date', id: 'midnight' }],
    ]);
    h.model.press(2, 1, 0.5 * 48);
    expect(cb.onCellPress).toHaveBeenCalledWith(input.lane, Date.parse('2024-01-03T00:00Z'));
    expect(cb.onGapPress).not.toHaveBeenCalled();
  });
  it('resolves both repeated-hour halves to distinct absolute times and rejects the hatched spring region', () => {
    const cb = callbacks();
    const fall = inputFor('schedule-fall');
    const h = harness({ ...fall, ...cb });
    h.model.press(6, 1, 1.25 * 48);
    h.model.press(6, 1, 1.75 * 48);
    expect(cb.onCellPress.mock.calls.map(([, time]) => new Date(time).toISOString())).toEqual([
      '2024-11-03T06:00:00.000Z',
      '2024-11-03T07:00:00.000Z',
    ]);
    const spring = inputFor('schedule-spring');
    h.update({ ...spring, ...cb });
    h.model.press(6, 1, 2.5 * 48);
    expect(cb.onCellPress).toHaveBeenCalledTimes(2);
    expect(cb.onIntervalPress).not.toHaveBeenCalled();
    expect(cb.onGapPress).not.toHaveBeenCalled();
    h.model.press(6, 5, 3.5 * 48);
    expect(cb.onIntervalPress).toHaveBeenCalledTimes(1);
  });
  it('clamps a 60-minute floor to the second Lord Howe occurrence start', () => {
    const input = inputFor('schedule-lord-howe');
    const cb = callbacks();
    const h = harness({ ...input, ...cb });
    h.model.press(6, 1, 1.625 * 48);
    h.model.press(6, 1, 1.875 * 48);
    expect(cb.onCellPress.mock.calls.map(([, time]) => new Date(time).toISOString())).toEqual([
      '2024-04-06T14:00:00.000Z',
      '2024-04-06T15:00:00.000Z',
    ]);
    expect(timeAtY(h.model.projection, 6, 1.875 * 48)).toBe(Date.parse('2024-04-06T15:15Z'));
  });
  it('uses final bounds, interval priority over gaps, and later-layer ties without snapping the hit point', () => {
    const input = inputFor('schedule-layers');
    const booking = input.lane.layers[1] as Layer;
    const lane = { ...input.lane, layers: [...input.lane.layers, { ...booking, id: 'later' }] };
    const cb = callbacks();
    const h = harness({ ...input, lane, ...cb });
    h.model.press(0, 5, 10.75 * 48);
    expect(cb.onIntervalPress.mock.calls[0]?.[0].layerId).toBe('later');
    h.model.press(0, 4, 11.5 * 48);
    expect(cb.onIntervalPress.mock.calls[1]?.[0].layerId).toBe('open');
    expect(cb.onCellPress).not.toHaveBeenCalled();
    expect(cb.onGapPress).not.toHaveBeenCalled();
  });
  it('rejects invalid points and invalid steps, and represents the Apia week with six columns', () => {
    const input = inputFor('schedule-apia');
    const cb = callbacks();
    const h = harness({ ...input, ...cb });
    expect(h.model.days.map((day) => day.localDate)).toEqual([
      '2011-12-26',
      '2011-12-27',
      '2011-12-28',
      '2011-12-29',
      '2011-12-31',
      '2012-01-01',
    ]);
    for (const [column, x, y] of [
      [0, NaN, 0],
      [0, 0, NaN],
      [0, Infinity, 0],
      [0, 0, Infinity],
      [0, -1, 0],
      [0, 280 / 6, 0],
      [0, 0, -1],
      [0, 0, 1152],
      [-1, 0, 0],
      [6, 0, 0],
      [0.5, 0, 0],
      [NaN, 0, 0],
    ])
      h.model.press(column as number, x as number, y as number);
    expect(cb.onCellPress).not.toHaveBeenCalled();
    expect(cb.onIntervalPress).not.toHaveBeenCalled();
    expect(cb.onGapPress).not.toHaveBeenCalled();
    for (const minuteStep of [0, -1, 7, 1.5, Infinity])
      expect(() => harness({ ...input, minuteStep })).toThrow('positive divisor');
    h.update({
      ...input,
      windowSpec: { ...input.windowSpec, span: 'day', anchorDate: '2011-12-30' },
    });
    expect(h.model.days).toEqual([]);
    h.model.press(0, 1, 0);
  });
  it('lays out a changed hour scale once and reuses both retained scale keys', () => {
    const input = inputFor('schedule-layers');
    const h = harness(input);
    const original = h.model.geometry;
    expect(h.model.projection.pxPerHour).toBe(48);
    const before = layoutStats().runs;
    h.update({ ...input, pxPerHour: 64.5 });
    const scaled = h.model.geometry;
    expect(scaled).not.toBe(original);
    expect(h.model.projection.pxPerHour).toBe(64.5);
    expect(scaled.rects.find((rect) => rect.layerId === 'sessions')?.y).toBe(10.5 * 64.5);
    expect(layoutStats().runs - before).toBe(1);
    h.update({ ...input, pxPerHour: 64.5 });
    expect(h.model.geometry).toBe(scaled);
    h.update(input);
    expect(h.model.geometry).toBe(original);
    expect(layoutStats().runs - before).toBe(1);
    expect(coverageStats().runs).toBe(1);
    for (const pxPerHour of [0, -1, NaN, Infinity, -Infinity])
      expect(() => harness({ ...input, pxPerHour })).toThrow('positive finite number');
  });
  it('retains geometry across step, highlight, and lane metadata changes', () => {
    const input = inputFor('schedule-layers');
    const h = harness(input);
    const geometry = h.model.geometry;
    for (const minuteStep of [15, 30, 60])
      h.update({
        ...input,
        minuteStep,
        lane: { ...input.lane, complete: false, label: 'Updated', timezone: 'Pacific/Auckland' },
        highlightSource: { kind: 'rule', id: 'morning', label: 'New label' },
      });
    expect(h.model.geometry).toBe(geometry);
    expect(layoutStats().runs).toBe(1);
    expect(coverageStats().runs).toBe(1);
    h.update({ ...input, windowSpec: { ...input.windowSpec, timezone: 'Pacific/Auckland' } });
    expect(layoutStats().runs).toBe(2);
    h.update(input);
    expect(h.model.geometry).toBe(geometry);
  });
  it('updates now on the clock lifecycle, includes window start, and excludes window end', () => {
    const input = inputFor('schedule-empty');
    const now = spyOn(Date, 'now').mockReturnValue(Date.parse('2024-01-01T00:00Z'));
    let tick!: () => void;
    spyOn(globalThis, 'setInterval').mockImplementation(((callback: () => void) => {
      tick = callback;
      return 17;
    }) as unknown as typeof setInterval);
    const clear = spyOn(globalThis, 'clearInterval').mockImplementation(() => {});
    const h = harness(input);
    expect(h.model.now).toBe(h.model.window.start);
    now.mockReturnValue(h.model.window.end - 1);
    act(tick);
    expect(h.model.now).toBe(h.model.window.end - 1);
    now.mockReturnValue(h.model.window.end);
    act(tick);
    expect(h.model.now).toBeNull();
    act(() => trees.pop()?.unmount());
    expect(clear).toHaveBeenCalledWith(17);
  });
  it('switches Roster to Schedule and back with expanded deltas 0 and layout runs deltas 1 then 0', () => {
    let tree!: ReactTestRenderer;
    const windowSpec = scheduleFixtures['schedule-layers'].windowSpec;
    function RosterHook() {
      const lane = scheduleLane('schedule-layers', windowSpec);
      const model = useRoster({ lanes: [lane], windowSpec });
      model.geometryFor(lane);
      return null;
    }
    function ScheduleHook() {
      useSchedule({ lane: scheduleLane('schedule-layers', windowSpec), windowSpec });
      return null;
    }
    act(() => {
      tree = create(createElement(RosterHook));
    });
    trees.push(tree);
    const before = { layout: layoutStats(), expansion: expandStats(), coverage: coverageStats() };
    expect(before.expansion.expanded).toBeGreaterThan(0);
    act(() => tree.update(createElement(ScheduleHook)));
    expect(expandStats().expanded - before.expansion.expanded).toBe(0);
    expect(layoutStats().runs - before.layout.runs).toBe(1);
    expect(coverageStats().runs - before.coverage.runs).toBe(0);
    const columns = layoutStats();
    act(() => tree.update(createElement(RosterHook)));
    expect(expandStats().expanded - before.expansion.expanded).toBe(0);
    expect(layoutStats().runs - columns.runs).toBe(0);
    expect(layoutStats().cacheHits - columns.cacheHits).toBe(1);
  });
});
