import '../support/native-host';
import { afterEach, describe, expect, it, mock } from 'bun:test';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import * as adapter from '../../src/adapters/rrule';
import { Schedule } from '../../src/components/schedule';
import { ScheduleDayLayout } from '../../src/components/schedule/days/layout';
import * as core from '../../src/core';

mock.module('react-native-roster/core', () => core);
mock.module('react-native-roster/rrule', () => adapter);
const { useScheduleFixture } = await import(
  '../../demo/components/gallery/fixtures/schedule/use-schedule-fixture'
);

const trees: ReactTestRenderer[] = [];
function render(element: ReturnType<typeof createElement>) {
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
afterEach(() => {
  for (const tree of trees.splice(0)) act(() => tree.unmount());
  mock.restore();
});

describe('schedule fixture hook', () => {
  it('navigates the actual Apia route through the skipped day and onward', () => {
    let route!: ReturnType<typeof useScheduleFixture>;
    function Route() {
      route = useScheduleFixture('schedule-apia');
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
});
