import './render-host.test';
import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { createElement, type ElementType, type ReactElement } from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { Roster } from '../src/components/roster';
import { Schedule } from '../src/components/schedule';
import { ScheduleDayLayout } from '../src/components/schedule/days/layout';
import { ScheduleColumn } from '../src/components/schedule/parts/column';
import { ScheduleGutter } from '../src/components/schedule/parts/gutter';
import { ScheduleTransition } from '../src/components/schedule/parts/transition';
import type { ScheduleColumnInput, ScheduleProps } from '../src/components/schedule/schedule.types';
import { ScheduleWidth } from '../src/components/schedule/use-schedule-viewport';
import * as core from '../src/core';
import { clearLayoutCache, layoutStats } from '../src/core';
import * as adapter from '../src/rrule';
import { type ScheduleFixtureId, scheduleFixtures, scheduleLane } from './fixtures/schedule';

mock.module('react-native-roster/core', () => core);
mock.module('react-native-roster/rrule', () => adapter);
const { useScheduleRoute } = await import('../demo/components/schedule-route/use-schedule-route');

const trees: ReactTestRenderer[] = [];
function render(element: ReactElement) {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  for (const node of tree.root.findAll(
    (node) => typeof node.type === 'string' && node.props.onLayout,
  ))
    act(() => node.props.onLayout({ nativeEvent: { layout: { width: 328, height: 720 } } }));
  trees.push(tree);
  return tree;
}
function propsFor(id: ScheduleFixtureId): ScheduleProps {
  const windowSpec = scheduleFixtures[id].windowSpec;
  return { lane: scheduleLane(id, windowSpec), windowSpec };
}
afterEach(() => {
  for (const tree of trees.splice(0)) act(() => tree.unmount());
  mock.restore();
});

describe('Schedule chassis and day zones', () => {
  it('uses the React 18 provider API and mounts both read surfaces', async () => {
    const source = await Bun.file(
      new URL('../src/components/schedule/index.tsx', import.meta.url),
    ).text();
    expect(source).toContain('<ScheduleWidth.Provider value={width}>');
    const props = propsFor('schedule-layers');
    const tree = render(createElement(Schedule, props));
    const host = tree.root.findAll(
      (node) => typeof node.type === 'string' && node.props.onLayout,
    )[0];
    expect(host?.props.children.type).toBe(ScheduleWidth.Provider);
    expect(tree.root.findAllByType(ScheduleDayLayout)).toHaveLength(7);
    const roster = render(
      createElement(Roster, { lanes: [props.lane], windowSpec: props.windowSpec }),
    );
    expect(roster.root.findAllByType('LegendList' as ElementType)).toHaveLength(1);
  });
  it('fits seven equal columns at phone and desktop widths and scrolls only vertically', () => {
    const props = propsFor('schedule-layers');
    clearLayoutCache();
    core.resetStats();
    const tree = render(createElement(Schedule, props));
    expect(layoutStats().runs).toBe(1);
    const scroll = tree.root.findByType('ScrollView' as ElementType);
    expect(scroll.props.horizontal).toBe(false);
    const measure = tree.root.findAll(
      (node) => typeof node.type === 'string' && node.props.onLayout,
    )[0] as ReactTestInstance;
    for (const width of [320, 390, 1280]) {
      act(() => measure.props.onLayout({ nativeEvent: { layout: { width, height: 720 } } }));
      const days = tree.root.findAllByType(ScheduleDayLayout);
      expect(days).toHaveLength(7);
      expect(days.reduce((sum, day) => sum + day.props.width, 48)).toBeCloseTo(width);
      expect(days.every((day) => day.props.height === 24 * 48)).toBe(true);
      expect(tree.root.findAllByProps({ testID: 'schedule-hour-band' })).toHaveLength(7 * 24);
      const column = tree.root
        .findAllByType('Pressable' as ElementType)
        .find((node) => node.props.testID === 'schedule-day-2024-01-01') as ReactTestInstance;
      expect(column.props.style.width).toBe((width - 48) / 7);
    }
    const runs = layoutStats().runs;
    act(() => measure.props.onLayout({ nativeEvent: { layout: { width: 1280, height: 500 } } }));
    expect(layoutStats().runs).toBe(runs);
    act(() =>
      tree.update(
        createElement(Schedule, {
          ...props,
          minuteStep: 15,
          highlightSource: { kind: 'rule', id: 'morning' },
        }),
      ),
    );
    expect(layoutStats().runs).toBe(runs);
    expect(JSON.stringify(tree.toJSON())).toContain('#f59e0b');
    act(() => measure.props.onLayout({ nativeEvent: { layout: { width: 0, height: 500 } } }));
    expect(tree.root.findAllByType(ScheduleDayLayout)[0]?.props.width).toBe(0);
  });
  it('passes a changed hour scale to the gutter and matches the grid and day heights', () => {
    const props = propsFor('schedule-empty');
    const gutterZone = mock((input: { hours: number[]; pxPerHour: number }) =>
      createElement(ScheduleGutter, input),
    );
    const tree = render(createElement(Schedule, { ...props, gutterZone }));
    expect(tree.root.findByType(ScheduleGutter).props.pxPerHour).toBe(48);
    act(() => tree.update(createElement(Schedule, { ...props, pxPerHour: 64, gutterZone })));
    expect(gutterZone).toHaveBeenCalledWith({
      hours: Array.from({ length: 24 }, (_, hour) => hour),
      pxPerHour: 64,
    });
    expect(tree.root.findByType(ScheduleGutter).props.pxPerHour).toBe(64);
    expect(
      tree.root.findAllByType(ScheduleDayLayout).every((day) => day.props.height === 24 * 64),
    ).toBe(true);
    expect(
      tree.root
        .findAllByProps({ testID: 'schedule-hour-band' })
        .every((band) => band.props.style.height === 64),
    ).toBe(true);
  });
  it('shares interval styles, propagates native column and gap presses, and respects booking priority', () => {
    const props = propsFor('schedule-layers');
    const onIntervalPress = mock();
    const onGapPress = mock();
    const tree = render(createElement(Schedule, { ...props, onIntervalPress, onGapPress }));
    const column = tree.root
      .findAllByType('Pressable' as ElementType)
      .find((node) => node.props.testID === 'schedule-day-2024-01-01') as ReactTestInstance;
    column.props.onPress({ nativeEvent: { locationX: 5, locationY: 10.75 * 48 } });
    expect(onIntervalPress.mock.calls[0]?.[0].sources).toEqual([{ kind: 'session', id: '1' }]);
    const gap = tree.root
      .findAllByType('Pressable' as ElementType)
      .find((node) =>
        node.props.accessibilityLabel?.endsWith(': removed time'),
      ) as ReactTestInstance;
    const stopPropagation = mock();
    gap.props.onPress({ stopPropagation, nativeEvent: { locationX: 1, locationY: 1 } });
    expect(onGapPress.mock.calls[0]?.[0].sources).toEqual([{ kind: 'date', id: 'session-1-gap' }]);
    expect(stopPropagation).toHaveBeenCalledTimes(1);
    gap.props.onPress({ stopPropagation, nativeEvent: { locationX: 5, locationY: 1 } });
    expect(onIntervalPress).toHaveBeenCalledTimes(2);
  });
  it('shows transition badges, the spring hatch, and the repeated region divider at both offset sizes', () => {
    const tree = render(createElement(Schedule, propsFor('schedule-spring')));
    const skip = tree.root.findByProps({ testID: 'schedule-skip' });
    expect(skip.props.style.top).toBe(2 * 48);
    expect(skip.props.style.height).toBe(48);
    expect(skip.props.pointerEvents).toBe('none');
    expect(skip.children.length).toBeGreaterThan(1);
    expect(JSON.stringify(tree.toJSON())).toContain('Clock change');
    act(() => tree.update(createElement(Schedule, propsFor('schedule-fall'))));
    expect(tree.root.findByProps({ testID: 'schedule-repeat' }).props.style.top).toBe(1.5 * 48);
    expect(JSON.stringify(tree.toJSON())).toContain('again');
    act(() => tree.update(createElement(Schedule, propsFor('schedule-lord-howe'))));
    expect(tree.root.findByProps({ testID: 'schedule-repeat' }).props.style.top).toBe(1.75 * 48);
  });
  it('navigates the actual Apia route through the skipped day and onward', () => {
    let route!: ReturnType<typeof useScheduleRoute>;
    function Route() {
      route = useScheduleRoute('schedule-apia');
      return createElement(Schedule, { lane: route.lane, windowSpec: route.windowSpec });
    }
    const tree = render(createElement(Route));
    act(() => route.setSpan('day'));
    expect(route.windowSpec.anchorDate).toBe('2011-12-26');
    for (let day = 27; day <= 31; day++) {
      adapter.resetExpandStats();
      act(() => route.navigate(core.next(route.windowSpec)));
      expect(route.windowSpec.anchorDate).toBe(`2011-12-${day}`);
      if (day === 30) {
        expect(route.lane.complete).toBe(true);
        expect(route.lane.layers.every((layer) => layer.intervals.length === 0)).toBe(true);
        expect(adapter.expandStats().expanded).toBe(0);
        expect(tree.root.findAllByType(ScheduleDayLayout)).toHaveLength(0);
        expect(JSON.stringify(tree.toJSON())).toContain('Skipped local date 2011-12-30');
      } else {
        expect(tree.root.findAllByType(ScheduleDayLayout)).toHaveLength(1);
      }
    }
    act(() => route.navigate(core.prev(route.windowSpec)));
    expect(tree.root.findAllByType(ScheduleDayLayout)).toHaveLength(0);
  });
  it('shows six Apia columns and the header gap for December 30, including a wholly skipped day span', () => {
    const props = propsFor('schedule-apia');
    const tree = render(createElement(Schedule, props));
    expect(tree.root.findAllByType(ScheduleDayLayout)).toHaveLength(6);
    expect(tree.root.findAllByProps({ testID: 'schedule-hour-band' })).toHaveLength(6 * 24);
    expect(tree.root.findByProps({ testID: 'schedule-missing-2011-12-30' }).props.style.width).toBe(
      0,
    );
    expect(tree.root.findAllByProps({ testID: 'schedule-skip' })).toHaveLength(0);
    act(() =>
      tree.update(
        createElement(Schedule, {
          ...props,
          windowSpec: { ...props.windowSpec, span: 'day', anchorDate: '2011-12-30' },
        }),
      ),
    );
    expect(tree.root.findAllByType(ScheduleDayLayout)).toHaveLength(0);
    expect(JSON.stringify(tree.toJSON())).toContain('Skipped local date 2011-12-30');
    const skippedDateZone = mock(({ localDate }: { localDate: string }) =>
      createElement('custom-skipped-date', { localDate }),
    );
    act(() => tree.update(createElement(Schedule, { ...props, skippedDateZone })));
    expect(skippedDateZone).toHaveBeenCalledWith({ localDate: '2011-12-30' });
    expect(tree.root.findByType('custom-skipped-date' as ElementType).props.localDate).toBe(
      '2011-12-30',
    );
    expect(tree.root.findAllByProps({ testID: 'schedule-missing-2011-12-30' })).toHaveLength(0);
  });
  it('shows localized incompleteness outside covered time and composes every replaceable zone', () => {
    const props = propsFor('schedule-incomplete');
    expect(props.lane.complete).toBe(false);
    const tree = render(createElement(Schedule, { ...props, incompleteLabel: 'Partial week' }));
    expect(JSON.stringify(tree.toJSON())).toContain('Partial week');
    act(() => tree.update(createElement(Schedule, props)));
    expect(JSON.stringify(tree.toJSON())).toContain('Availability may be incomplete');
    const fall = propsFor('schedule-fall');
    spyOn(Date, 'now').mockReturnValue(Date.parse('2024-11-03T07:30Z'));
    const columns: ScheduleColumnInput[] = [];
    const zones: Partial<ScheduleProps> = {
      gutterZone: mock(({ hours, pxPerHour }) =>
        createElement('custom-gutter', { hours, pxPerHour }),
      ),
      dayHeaderZone: mock(({ day }) => createElement('custom-header', { day })),
      columnZone: mock((input) => {
        columns.push(input);
        return createElement(ScheduleColumn, input);
      }),
      transitionZone: mock((input) => createElement('custom-transition', input)),
      nowLineZone: mock((input) => createElement('custom-now', input)),
      intervalZone: mock((input) => createElement('custom-interval', input)),
      gapZone: mock((input) => createElement('custom-gap', input)),
      incompleteZone: mock((input) => createElement('custom-incomplete', input)),
    };
    const withGaps = {
      ...fall.lane,
      complete: false,
      layers: fall.lane.layers.map((layer) => ({ ...layer, gaps: layer.intervals })),
    };
    const replaced = render(createElement(Schedule, { ...fall, ...zones, lane: withGaps }));
    expect(replaced.root.findByType('custom-gutter' as ElementType).props.hours).toHaveLength(24);
    expect(replaced.root.findAllByType('custom-header' as ElementType)).toHaveLength(7);
    expect(replaced.root.findByType('custom-transition' as ElementType).props.height).toBe(48);
    expect(replaced.root.findByType('custom-now' as ElementType).props.y).toBe(1.75 * 48);
    expect(replaced.root.findByType('custom-incomplete' as ElementType).props.lane).toBe(withGaps);
    expect(replaced.root.findAllByType('custom-gap' as ElementType).length).toBeGreaterThan(0);
    expect(replaced.root.findAllByType('custom-interval' as ElementType).length).toBeGreaterThan(0);
    for (const [column, input] of columns.entries())
      expect(input.rects.every((rect) => rect.column === column)).toBe(true);
    columns[0]?.press(1, 1);
  });
  it('draws the default now line in the current occurrence above all layer z values', () => {
    spyOn(Date, 'now').mockReturnValue(Date.parse('2024-11-03T07:30Z'));
    const tree = render(createElement(Schedule, propsFor('schedule-fall')));
    const line = tree.root.findByProps({ testID: 'schedule-now-6' });
    expect(line.props.style.top).toBe(1.75 * 48);
    expect(line.props.pointerEvents).toBe('none');
    const day = tree.root.findAllByType(ScheduleDayLayout)[6] as ReactTestInstance;
    expect(day.props.chromeZ).toBeGreaterThan(0);
  });
  it('does not draw a transition whose skipped wall region belongs entirely to the omitted date', () => {
    const tree = render(
      createElement(ScheduleTransition, {
        day: { start: 0, end: 1, localDate: '2011-12-31', label: 'Sat', transitions: [] },
        transition: { at: 0, deltaMinutes: 1440 },
        y: 0,
        height: 0,
        width: 40,
      }),
    );
    expect(tree.toJSON()).toBeNull();
  });
});
