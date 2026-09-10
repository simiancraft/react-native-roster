import './render-host.test';
import { describe, expect, it, mock } from 'bun:test';
import type { ElementType, ReactElement } from 'react';
import { createElement, Profiler } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { RosterGap } from '../src/components/layers/parts/gap';
import { RosterInterval } from '../src/components/layers/parts/interval';
import { Roster } from '../src/components/roster';
import { LaneRow } from '../src/components/roster/lane-row';
import { RosterBody } from '../src/components/roster/parts/body';
import { RosterGrid } from '../src/components/roster/parts/grid';
import { RosterLaneLabel } from '../src/components/roster/parts/lane-label';
import type {
  BodyInput,
  GridInput,
  HeaderInput,
  LabelColumnInput,
  LaneLabelInput,
} from '../src/components/roster/roster.types';
import type { Lane, Layer } from '../src/core';
import { clearLayoutCache, layoutLane, layoutStats, windowFor } from '../src/core';
import { rosterFixtures, rosterWindowSpec } from './fixtures/roster';

function render(element: ReactElement) {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  return tree;
}
function close(tree: ReactTestRenderer) {
  act(() => tree.unmount());
}

describe('Roster zones and rect primitives', () => {
  it('renders the default empty zone and a replacement', () => {
    const tree = render(createElement(Roster, { lanes: [], windowSpec: rosterWindowSpec }));
    expect(tree.root.findByType('Text' as ElementType).props.children).toBe('No lanes');
    act(() =>
      tree.update(
        createElement(Roster, {
          lanes: [],
          windowSpec: rosterWindowSpec,
          emptyZone: () => createElement('custom-empty'),
        }),
      ),
    );
    expect(tree.root.findByType('custom-empty' as ElementType)).toBeDefined();
    close(tree);
  });
  it('renders no body for a wholly skipped local day', () => {
    const bodyZone = mock(() => createElement('custom-body'));
    const tree = render(
      createElement(Roster, {
        lanes: rosterFixtures['single-lane'].lanes,
        windowSpec: { span: 'day', anchorDate: '2011-12-30', timezone: 'Pacific/Apia' },
        bodyZone,
      }),
    );
    expect(tree.toJSON()).toBeNull();
    expect(bodyZone).not.toHaveBeenCalled();
    close(tree);
  });
  it('composes defaults, virtualizes at fixed height, and supplies all resolved label data', () => {
    const lanes = rosterFixtures['never-set'].lanes;
    const tree = render(
      createElement(Roster, {
        lanes,
        windowSpec: rosterWindowSpec,
        incompleteLabel: 'Partial data',
        neverSetLabel: 'Unconfigured',
      }),
    );
    expect(tree.root.findAllByType('LegendList' as ElementType)).toHaveLength(0);
    act(() =>
      tree.root
        .findAll((node) => typeof node.props.onLayout === 'function')[0]
        ?.props.onLayout({ nativeEvent: { layout: { width: 800, height: 480 } } }),
    );
    const list = tree.root.findByType('LegendList' as ElementType);
    expect(list.props.estimatedItemSize).toBe(48);
    expect(list.props.estimatedListSize).toEqual({ width: 5040, height: 480 });
    expect(list.props.maintainVisibleContentPosition).toBe(false);
    expect(list.props.getFixedItemSize()).toBe(48);
    expect(list.props.keyExtractor(lanes[0])).toBe('never');
    expect(list.props.onViewableItemsChanged).toBeUndefined();
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('Partial data');
    expect(text).toContain('Unconfigured');
    const latest = tree.root.findByType('LegendList' as ElementType);
    const row = render(latest.props.renderItem({ item: lanes[0] }));
    expect(row.root.findByType('Pressable' as ElementType).props.style.height).toBe(48);
    expect(tree.root.findAllByProps({ testID: 'roster-grid' })).toHaveLength(1);
    close(row);
    close(tree);
  });
  it('supplies structural replacements with all already-derived inputs', () => {
    const headerZone = mock((_input: HeaderInput) => createElement('custom-header'));
    const laneLabelColumnZone = mock((_input: LabelColumnInput) => createElement('custom-labels'));
    const bodyZone = mock((_input: BodyInput) => createElement('custom-body'));
    const lanes = rosterFixtures['single-lane'].lanes;
    const tree = render(
      createElement(Roster, {
        lanes,
        windowSpec: rosterWindowSpec,
        headerZone,
        laneLabelColumnZone,
        bodyZone,
      }),
    );
    expect(headerZone.mock.calls[0]?.[0].ticks).toHaveLength(7);
    expect(laneLabelColumnZone.mock.calls[0]?.[0].labels).toEqual([
      {
        lane: lanes[0] as Lane,
        flag: 'none',
        complete: true,
        viewTimezone: 'UTC',
        incompleteLabel: 'Availability may be incomplete',
        neverSetLabel: 'No availability set',
      },
    ]);
    expect(bodyZone.mock.calls[0]?.[0].scroll).toBe(headerZone.mock.calls[0]?.[0].scroll);
    expect(typeof bodyZone.mock.calls[0]?.[0].geometryFor).toBe('function');
    expect(typeof bodyZone.mock.calls[0]?.[0].press).toBe('function');
    close(tree);
  });
  it('keeps retained row presses current without changing the list content key', () => {
    const start = Date.UTC(2024, 0, 1);
    const minute = 60_000;
    const lane: Lane = {
      id: 'retained',
      label: 'Retained lane',
      layers: [
        {
          id: 'open',
          role: 'availability',
          z: 0,
          style: { color: 'green' },
          intervals: [{ start: start + 60 * minute, end: start + 120 * minute, sources: [] }],
          gaps: [{ start: start + 120 * minute, end: start + 180 * minute, sources: [] }],
        },
      ],
    };
    const lanes = [lane];
    const previous = { onCellPress: mock(), onIntervalPress: mock(), onGapPress: mock() };
    const next = { onCellPress: mock(), onIntervalPress: mock(), onGapPress: mock() };
    const input = { lanes, windowSpec: rosterWindowSpec, pxPerMinute: 1 };
    const tree = render(createElement(Roster, { ...input, ...previous, minuteStep: 60 }));
    act(() =>
      tree.root
        .findAll((node) => typeof node.props.onLayout === 'function')[0]
        ?.props.onLayout({ nativeEvent: { layout: { width: 800, height: 480 } } }),
    );
    const list = tree.root.findByType('LegendList' as ElementType);
    const key = list.props.extraData;
    // Retain the rendered item exactly as LegendList does when data and extraData match.
    const row = render(list.props.renderItem({ item: lane }));
    const press = row.root.findByType(LaneRow).props.press;
    const onPress = row.root.findByProps({ testID: 'roster-lane-retained' }).props.onPress;
    onPress({ nativeEvent: { locationX: 47, locationY: 12 } });
    expect(previous.onCellPress).toHaveBeenLastCalledWith(lane, start);
    act(() => tree.update(createElement(Roster, { ...input, ...next, minuteStep: 15 })));
    expect(tree.root.findByType('LegendList' as ElementType).props.extraData).toBe(key);
    expect(tree.root.findByType(LaneRow).props.press).toBe(press);
    onPress({ nativeEvent: { locationX: 47, locationY: 12 } });
    onPress({ nativeEvent: { locationX: 90, locationY: 12 } });
    onPress({ nativeEvent: { locationX: 150, locationY: 12 } });
    expect(next.onCellPress).toHaveBeenLastCalledWith(lane, start + 45 * minute);
    expect(next.onIntervalPress).toHaveBeenCalledTimes(1);
    expect(next.onGapPress).toHaveBeenCalledTimes(1);
    expect(previous.onCellPress).toHaveBeenCalledTimes(1);
    expect(previous.onIntervalPress).not.toHaveBeenCalled();
    expect(previous.onGapPress).not.toHaveBeenCalled();
    close(row);
    close(tree);
  });
  it('records row mount and update commits when profiling is supplied', () => {
    const onRender = mock();
    function bodyZone(input: BodyInput) {
      return createElement(RosterBody, { ...input, onRowRender: onRender });
    }
    const input = {
      lanes: rosterFixtures['single-lane'].lanes,
      windowSpec: rosterWindowSpec,
      bodyZone,
    };
    const tree = render(createElement(Roster, input));
    act(() =>
      tree.root
        .findAll((node) => typeof node.props.onLayout === 'function')[0]
        ?.props.onLayout({ nativeEvent: { layout: { width: 800, height: 480 } } }),
    );
    expect(onRender.mock.calls.some(([id, phase]) => id === 'one' && phase === 'mount')).toBe(true);
    onRender.mockClear();
    act(() =>
      tree.update(
        createElement(Roster, { ...input, highlightSource: { kind: 'rule', id: 'one' } }),
      ),
    );
    expect(onRender.mock.calls.some(([id, phase]) => id === 'one' && phase === 'update')).toBe(
      true,
    );
    close(tree);
  });
  it('keeps mounted LaneRow renders at zero across vertical scroll', () => {
    clearLayoutCache();
    const intervalZone = mock(RosterInterval);
    const onRender = mock(() => {});
    const tree = render(
      createElement(
        Profiler,
        { id: 'roster', onRender },
        createElement(Roster, {
          lanes: rosterFixtures['200-lanes'].lanes,
          windowSpec: rosterWindowSpec,
          intervalZone,
        }),
      ),
    );
    act(() =>
      tree.root
        .findAll((node) => typeof node.props.onLayout === 'function')[0]
        ?.props.onLayout({ nativeEvent: { layout: { width: 800, height: 480 } } }),
    );
    const list = tree.root.findByType('LegendList' as ElementType);
    expect(tree.root.findAllByType(LaneRow)).toHaveLength(24);
    expect(intervalZone).toHaveBeenCalledTimes(24 * 63);
    const mountedCalls = intervalZone.mock.calls.length;
    expect(onRender.mock.calls.length).toBeGreaterThan(0);
    onRender.mockClear();
    const before = layoutStats();
    for (const y of [48, 96, 144, 96, 48, 0]) {
      act(() => list.props.onScroll({ nativeEvent: { contentOffset: { x: 0, y } } }));
      expect(intervalZone.mock.calls.length - mountedCalls).toBe(0);
      expect(tree.root.findByType('LegendList' as ElementType).props).toBe(list.props);
    }
    expect(onRender).not.toHaveBeenCalled();
    expect(layoutStats()).toEqual(before);
    expect(tree.root.findByProps({ testID: 'roster-labels' }).children).toHaveLength(200);
    close(tree);
  });
  it('reads replacement zones and the empty example from the fixture record', () => {
    const fixture = rosterFixtures['every-zone'];
    expect(fixture.showsEmptyExample).toBe(true);
    const tree = render(
      createElement(Roster, {
        lanes: fixture.lanes,
        windowSpec: rosterWindowSpec,
        ...fixture.zones,
      }),
    );
    act(() =>
      tree.root
        .findAll((node) => typeof node.props.onLayout === 'function')[0]
        ?.props.onLayout({ nativeEvent: { layout: { width: 800, height: 480 } } }),
    );
    expect(JSON.stringify(tree.toJSON())).toContain('Excluded');
    act(() =>
      tree.update(
        createElement(Roster, {
          lanes: [],
          windowSpec: rosterWindowSpec,
          ...fixture.zones,
        }),
      ),
    );
    expect(JSON.stringify(tree.toJSON())).toContain('Custom empty roster');
    close(tree);
  });
  it('draws one absolute view per rect and one gap pressable, with shared source highlighting', () => {
    const original = rosterFixtures['two-layers'].lanes[0] as Lane;
    const gapLayer = rosterFixtures['full-day-gap'].lanes[0]?.layers[0] as Layer;
    const lane = {
      ...original,
      layers: [{ ...gapLayer, id: 'gap', z: 3 }, ...original.layers].reverse(),
    };
    const geometry = layoutLane(lane, windowFor(rosterWindowSpec), {
      orientation: 'horizontal',
      viewTimezone: 'UTC',
      pxPerMinute: 1,
      rowHeight: 48,
    });
    const press = mock();
    const props = {
      lane,
      geometry,
      width: 10080,
      rowHeight: 48,
      press,
      intervalZone: RosterInterval,
      gapZone: RosterGap,
      highlightSource: { kind: 'rule', id: 'one', label: 'Different display label' },
    };
    const tree = render(createElement(LaneRow, props));
    const views = tree.root.findAllByType('View' as ElementType);
    expect(views).toHaveLength(geometry.rects.length);
    expect(views.some((view) => view.props.style[0].backgroundColor === '#f59e0b')).toBe(true);
    const pressables = tree.root.findAllByType('Pressable' as ElementType);
    expect(pressables).toHaveLength(1 + geometry.gapRects.length);
    pressables[0]?.props.onPress({ nativeEvent: { locationX: 700, locationY: 12 } });
    expect(press).toHaveBeenLastCalledWith(lane, 700, 12);
    const stopPropagation = mock();
    pressables[1]?.props.onPress({ stopPropagation, nativeEvent: { locationX: 30, locationY: 4 } });
    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(press).toHaveBeenLastCalledWith(lane, 30, 4);
    act(() => tree.update(createElement(LaneRow, { ...props, highlightSource: undefined })));
    expect(
      tree.root
        .findAllByType('View' as ElementType)
        .some((view) => view.props.style[0].backgroundColor === '#f59e0b'),
    ).toBe(false);
    close(tree);
  });
  it('applies chrome styles after defaults, sizes the corner, and swaps the grid', () => {
    const lanes = rosterFixtures['single-lane'].lanes;
    const gridZone = mock((input: GridInput) => createElement('custom-grid', input));
    const tree = render(
      createElement(Roster, {
        lanes,
        windowSpec: rosterWindowSpec,
        style: { backgroundColor: 'black' },
        headerStyle: { backgroundColor: 'red' },
        laneLabelColumnStyle: { backgroundColor: 'green' },
        bodyStyle: { backgroundColor: 'blue' },
        laneLabelWidth: 240,
        cornerZone: () => createElement('custom-corner'),
        gridZone,
      }),
    );
    act(() =>
      tree.root
        .findAll((node) => typeof node.props.onLayout === 'function')[0]
        ?.props.onLayout({ nativeEvent: { layout: { width: 800, height: 480 } } }),
    );
    const views = tree.root.findAllByType('View' as ElementType);
    const backgrounds = views.map((view) => JSON.stringify(view.props.style));
    expect(backgrounds[0]).toContain('"backgroundColor":"black"');
    expect(backgrounds.some((style) => style.includes('"backgroundColor":"red"'))).toBe(true);
    expect(backgrounds.some((style) => style.includes('"backgroundColor":"green"'))).toBe(true);
    expect(backgrounds.some((style) => style.includes('"backgroundColor":"blue"'))).toBe(true);
    expect(backgrounds.filter((style) => style.startsWith('{"width":240'))).toHaveLength(1);
    expect(backgrounds.filter((style) => style.includes('"width":240},{"border'))).toHaveLength(1);
    expect(tree.root.findByType('custom-corner' as ElementType).parent?.props.style.width).toBe(
      240,
    );
    expect(tree.root.findAllByProps({ testID: 'roster-grid' })).toHaveLength(0);
    expect(gridZone).toHaveBeenCalledTimes(1);
    expect(gridZone.mock.calls[0]?.[0].ticks).toHaveLength(7);
    expect(gridZone.mock.calls[0]?.[0].contentWidth).toBe(5040);
    const grid = render(createElement(RosterGrid, gridZone.mock.calls[0]?.[0] as GridInput));
    expect(grid.root.findByProps({ testID: 'roster-grid' }).children).toHaveLength(7);
    close(grid);
    close(tree);
  });
  it('shows the lane timezone only when it differs and flags only for never-set', () => {
    const lane = rosterFixtures['single-lane'].lanes[0] as Lane;
    const props: LaneLabelInput = {
      lane,
      flag: 'none',
      complete: true,
      viewTimezone: 'UTC',
      incompleteLabel: 'Partial',
      neverSetLabel: 'Unconfigured',
    };
    const tree = render(createElement(RosterLaneLabel, props));
    expect(JSON.stringify(tree.toJSON())).toContain('America/Chicago');
    act(() =>
      tree.update(createElement(RosterLaneLabel, { ...props, viewTimezone: 'America/Chicago' })),
    );
    expect(JSON.stringify(tree.toJSON())).not.toContain('America/Chicago');
    act(() =>
      tree.update(
        createElement(RosterLaneLabel, { ...props, lane: { ...lane, timezone: undefined } }),
      ),
    );
    expect(tree.root.findAllByType('Text' as ElementType)).toHaveLength(1);
    close(tree);
  });
});
