import '../support/native-host';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createElement, type ElementType } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import * as adapter from '../../src/adapters/rrule';
import { Roster } from '../../src/components/roster';
import { intervalHoverProps as nativeHover } from '../../src/components/roster/lanes/interval-hover';
import { intervalHoverProps as webHover } from '../../src/components/roster/lanes/interval-hover.web';
import { LaneRow } from '../../src/components/roster/lanes/lane';
import { RosterIncomplete } from '../../src/components/roster/lanes/parts/incomplete';
import type { RosterModel } from '../../src/components/roster/roster.types';
import { useRoster } from '../../src/components/roster/use-roster';
import type { Lane, LaneGeometry, Rect } from '../../src/core';
import * as core from '../../src/core';
import { rosterFixtures, rosterWindowSpec } from '../fixtures/roster';

// Exercise the demo's public imports against the same real source caches as the hook.
mock.module('react-native-roster/core', () => core);
mock.module('react-native-roster/rrule', () => adapter);
const { useRosterFixture } = await import(
  '../../demo/components/gallery/fixtures/roster/use-roster-fixture'
);

const projection = {
  orientation: 'horizontal' as const,
  viewTimezone: 'UTC',
  pxPerMinute: 1,
  rowHeight: 48,
};
const window = core.windowFor(rosterWindowSpec);

beforeEach(() => {
  core.clearLayoutCache();
  core.clearCoverageCache();
  core.resetStats();
  adapter.clearExpandCache();
  adapter.resetExpandStats();
});

function runs() {
  return {
    expanded: adapter.expandStats().expanded,
    layout: core.layoutStats().runs,
    coverage: core.coverageStats().runs,
  };
}

function galleryHarness(fixtureId: keyof typeof rosterFixtures) {
  let gallery!: ReturnType<typeof useRosterFixture>;
  let roster!: RosterModel;
  let tree!: ReactTestRenderer;
  function Hook() {
    gallery = useRosterFixture(fixtureId);
    roster = useRoster({
      lanes: gallery.fixture.lanes,
      windowSpec: gallery.windowSpec,
      sortLanes: gallery.sortLanes,
      highlightSource: gallery.highlightSource,
      onIntervalPress: gallery.selectRect,
      onGapPress: gallery.selectRect,
      onCellPress: gallery.selectCell,
    });
    return null;
  }
  act(() => {
    tree = create(createElement(Hook));
  });
  return {
    get gallery() {
      return gallery;
    },
    get roster() {
      return roster;
    },
    show() {
      return new Map(
        roster.orderedLanes.slice(0, 24).map((lane) => [lane.id, roster.geometryFor(lane)]),
      );
    },
    close() {
      act(() => tree.unmount());
    },
  };
}

describe('provenance interaction', () => {
  it('attaches no native hover and resolves web interval precedence using row-relative pointer coordinates', () => {
    const lane = rosterFixtures['booking-in-gap'].lanes[0] as Lane;
    const geometry = core.layoutLane(lane, window, projection);
    const onIntervalHover = mock((_rect: Rect, _lane: Lane) => {});
    const input = { lane, geometry, onIntervalHover };
    expect(nativeHover(input)).toEqual({});
    expect(webHover({ lane, geometry })).toEqual({});
    const handler = webHover(input).onPointerMove;
    const currentTarget = {
      getBoundingClientRect: () => ({ left: -100, top: 80, width: 10080, height: 48 }),
    };
    const before = runs();
    handler?.({ currentTarget, nativeEvent: { clientX: 560, clientY: 92, pointerType: 'mouse' } });
    expect(onIntervalHover).toHaveBeenCalledWith(geometry.rects[0], lane);
    expect(onIntervalHover.mock.calls[0]?.[0].sources).toEqual([
      { kind: 'session', id: 'inside-gap' },
    ]);
    for (const [clientX, clientY] of [
      [560, 80],
      [620, 92],
      [2000, 92],
      [-101, 92],
      [560, 128],
    ]) {
      handler?.({ currentTarget, nativeEvent: { clientX, clientY } });
    }
    handler?.({ currentTarget, nativeEvent: { clientX: 560, clientY: 92, pointerType: 'touch' } });
    expect(onIntervalHover).toHaveBeenCalledTimes(1);
    expect(runs()).toEqual(before);
    const equal = rosterFixtures['equal-z'].lanes[0] as Lane;
    const equalGeometry = core.layoutLane(equal, window, projection);
    webHover({ lane: equal, geometry: equalGeometry, onIntervalHover }).onPointerMove?.({
      currentTarget,
      nativeEvent: { clientX: 560, clientY: 92 },
    });
    expect(onIntervalHover.mock.calls.at(-1)?.[0].layerId).toBe('later');
  });

  it('reports only the exact source span while a web pointer moves within one lane', () => {
    const lane: Lane = {
      id: 'overlap',
      label: 'Overlap',
      layers: [
        {
          id: 'open',
          role: 'availability',
          z: 0,
          style: { color: '#000' },
          intervals: [
            {
              start: window.start,
              end: window.start + 120 * 60000,
              sources: [{ kind: 'rule', id: 'a' }],
            },
            {
              start: window.start + 60 * 60000,
              end: window.start + 180 * 60000,
              sources: [{ kind: 'rule', id: 'b' }],
            },
          ],
        },
      ],
    };
    const onIntervalHover = mock((_rect: Rect, _lane: Lane) => {});
    const handler = webHover({
      lane,
      geometry: core.layoutLane(lane, window, projection),
      onIntervalHover,
    }).onPointerMove;
    const currentTarget = {
      getBoundingClientRect: () => ({ left: 20, top: 30, width: 10080, height: 48 }),
    };
    for (const x of [0, 60, 120, 180])
      handler?.({ currentTarget, nativeEvent: { clientX: 20 + x, clientY: 40 } });
    expect(
      onIntervalHover.mock.calls.map(([rect]) => rect.sources.map((source) => source.id)),
    ).toEqual([['a'], ['a', 'b'], ['b']]);
  });

  it('assembles flag changes fresh while retaining rect, gap, and coverage references', () => {
    const lane = { ...(rosterFixtures['full-day-gap'].lanes[0] as Lane) };
    const original = core.layoutLane(lane, window, projection);
    const before = runs();
    lane.flag = 'never-set';
    expect(core.flagFor(lane, window)).toBe('never-set');
    const changed = core.layoutLane(lane, window, projection);
    expect(changed).not.toBe(original);
    expect(changed.flag).toBe('never-set');
    expect(changed.rects).toBe(original.rects);
    expect(changed.gapRects).toBe(original.gapRects);
    expect(changed.coverage).toBe(original.coverage);
    delete lane.flag;
    expect(core.flagFor(lane, window)).toBe('none');
    expect(core.layoutLane(lane, window, projection)).toBe(original);
    expect(runs()).toEqual(before);
  });

  it('places localized incomplete text in empty space without covering intervals', () => {
    const lane: Lane = { id: 'partial', label: 'Partial', complete: false, layers: [] };
    const geometry = core.layoutLane(lane, window, projection);
    let tree!: ReactTestRenderer;
    const props = { lane, geometry, width: 100, label: 'Partial data' };
    act(() => {
      tree = create(createElement(RosterIncomplete, props));
    });
    expect(tree.root.findByType('Text' as ElementType).props.children).toBe('Partial data');
    const rect = { x: 0, y: 0, width: 30, height: 48, z: 0, layerId: 'one', sources: [] };
    act(() =>
      tree.update(
        createElement(RosterIncomplete, {
          ...props,
          geometry: { ...geometry, rects: [{ ...rect, x: 60 }, rect, { ...rect, width: 20 }] },
        }),
      ),
    );
    expect(tree.root.findByType('Text' as ElementType).props.style).toMatchObject({
      left: 30,
      width: 30,
    });
    act(() =>
      tree.update(
        createElement(RosterIncomplete, {
          ...props,
          geometry: { ...geometry, rects: [{ ...rect, width: 100 }] },
        }),
      ),
    );
    expect(tree.toJSON()).toBeNull();
    act(() =>
      tree.update(createElement(RosterIncomplete, { ...props, lane: { ...lane, complete: true } })),
    );
    expect(tree.toJSON()).toBeNull();
    act(() => tree.unmount());
  });
});

describe('gallery target-warm proofs', () => {
  it('highlights a freshly constructed source across 20 adapter lanes with zero compute deltas', () => {
    const h = galleryHarness('highlight-rule');
    const geometries = h.show();
    expect(geometries.size).toBe(20);
    expect(adapter.expandStats().expanded).toBeGreaterThan(0);
    const before = runs();
    act(() => h.gallery.highlightRule());
    const first = h.gallery.highlightSource;
    expect(first).toEqual({ kind: 'rule', id: 'shared-rule' });
    for (const [id, geometry] of h.show())
      expect(geometry.rects).toBe(geometries.get(id)?.rects as Rect[]);
    act(() => h.gallery.highlightRule());
    expect(h.gallery.highlightSource).toEqual(first);
    expect(h.gallery.highlightSource).not.toBe(first);
    h.show();
    act(() => h.gallery.clearHighlight());
    h.show();
    expect(runs()).toEqual(before);
    expect(adapter.expandStats().cacheHits).toBeGreaterThan(0);
    h.close();
  });

  it('sorts all 200 lanes without geometry work, then reuses only warmed target viewport keys', () => {
    const h = galleryHarness('sort-coverage');
    expect(h.roster.coverage.size).toBe(200);
    expect(core.layoutStats().runs).toBe(0);
    const initial = h.show();
    const beforeSort = runs();
    const beforeLayout = core.layoutStats();
    act(() => h.gallery.setSort('availability'));
    expect(core.layoutStats()).toEqual(beforeLayout);
    expect(h.roster.orderedLanes[0]?.id).toBe('sort-199');
    expect(runs()).toEqual(beforeSort);
    const other = h.show(); // First encounter of these mounted lanes is target-cold.
    expect(core.layoutStats().runs).toBe(48);
    act(() => h.gallery.setSort('availabilityMinusBooking'));
    expect(h.roster.orderedLanes[0]?.id).toBe('sort-0');
    h.show();
    const before = runs();
    for (const sort of ['availability', 'availabilityMinusBooking', 'label'] as const) {
      const beforeLayout = core.layoutStats();
      act(() => h.gallery.setSort(sort));
      expect(core.layoutStats()).toEqual(beforeLayout);
      const target = sort === 'availability' ? other : initial;
      for (const [id, geometry] of h.show()) expect(geometry).toBe(target.get(id) as LaneGeometry);
      expect(runs()).toEqual(before);
    }
    expect(core.coverageStats().runs).toBe(200);
    h.close();
  });

  it.each([
    'single-lane',
    'full-day-gap',
    'booking-in-gap',
    'equal-z',
    'highlight-rule',
    'sort-coverage',
    'never-set',
    'incomplete-expansion',
  ] as const)('%s reports sources without recomputing after first render', (id) => {
    const h = galleryHarness(id);
    h.show();
    const lane = h.roster.orderedLanes[0] as Lane;
    const geometry = h.roster.geometryFor(lane);
    const rect = geometry.rects.at(-1) ?? geometry.gapRects[0];
    const before = runs();
    if (rect) {
      act(() => h.roster.press(lane, rect.x + rect.width / 2, rect.y + rect.height / 2));
      expect(h.gallery.selection).toBe(JSON.stringify(rect.sources));
    } else {
      act(() => h.roster.press(lane, 0, 0));
      expect(h.gallery.selection).toBe(new Date(window.start).toISOString());
    }
    h.show();
    expect(runs()).toEqual(before);
    if (id === 'incomplete-expansion') expect(lane.complete).toBe(false);
    h.close();
  });
});

it('draws highlightColor for fresh source identity on all 20 lanes and updates hover callbacks', () => {
  const lanes = rosterFixtures['highlight-rule'].lanesFor?.(
    window,
    adapter.expandRuleSet,
  ) as Lane[];
  const onIntervalHover = mock();
  const props = { lanes, windowSpec: rosterWindowSpec, onIntervalHover };
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(createElement(Roster, props));
  });
  act(() =>
    tree.root
      .findAll((node) => typeof node.props.onLayout === 'function')[0]
      ?.props.onLayout({ nativeEvent: { layout: { width: 800, height: 480 } } }),
  );
  expect(tree.root.findAllByType(LaneRow)).toHaveLength(20);
  const before = runs();
  const rects = new Map(
    tree.root.findAllByType(LaneRow).map((row) => [row.props.lane.id, row.props.geometry.rects]),
  );
  const replacementHover = mock();
  act(() =>
    tree.update(
      createElement(Roster, {
        ...props,
        onIntervalHover: replacementHover,
        highlightSource: { kind: 'rule', id: 'shared-rule', label: 'Fresh display label' },
      }),
    ),
  );
  for (const row of tree.root.findAllByType(LaneRow)) {
    expect(row.props.geometry.rects).toBe(rects.get(row.props.lane.id));
    expect(row.props.onIntervalHover).toBe(replacementHover);
    expect(
      row
        .findAllByType('View' as ElementType)
        .every((view) => view.props.style[0].backgroundColor === '#f59e0b'),
    ).toBe(true);
    expect(row.findByType('Pressable' as ElementType).props.onPointerMove).toBeUndefined();
  }
  for (const source of [
    { kind: 'date', id: 'shared-rule' },
    { kind: 'rule', id: 'other' },
  ]) {
    act(() => tree.update(createElement(Roster, { ...props, highlightSource: source })));
    for (const row of tree.root.findAllByType(LaneRow)) {
      expect(
        row
          .findAllByType('View' as ElementType)
          .every((view) => view.props.style[0].backgroundColor === '#4f9478'),
      ).toBe(true);
    }
  }
  expect(runs()).toEqual(before);
  act(() => tree.unmount());
});
