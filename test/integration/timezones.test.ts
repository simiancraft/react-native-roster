import '../support/native-host';
import { beforeEach, describe, expect, it } from 'bun:test';
import { createElement, type ElementType } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
  clearExpandCache,
  expandRuleSet,
  expandStats,
  resetExpandStats,
} from '../../src/adapters/rrule';
import { Roster } from '../../src/components/roster';
import { LaneRow } from '../../src/components/roster/lanes/lane';
import type { RosterProjection } from '../../src/components/roster/roster.types';
import { ticksFor } from '../../src/components/roster/utils/ticks';
import type { Lane, LaneGeometry, Projection, Rect, WindowSpec } from '../../src/core';
import {
  clearCoverageCache,
  clearLayoutCache,
  coverageStats,
  dayColumnsFor,
  layoutLane,
  layoutStats,
  resetStats,
  timeAtY,
  windowFor,
} from '../../src/core';
import { rosterFixtures } from '../fixtures/roster';
import {
  expandLanes,
  fallWeek,
  mixedZoneLanes,
  type RuleLane,
  ruleLane,
  springWeek,
} from '../fixtures/timezones';

const hour = 3_600_000;
const horizontal: RosterProjection = {
  orientation: 'horizontal',
  viewTimezone: 'America/Chicago',
  pxPerMinute: 1,
  rowHeight: 48,
};

beforeEach(() => {
  clearLayoutCache();
  clearCoverageCache();
  clearExpandCache();
  resetStats();
  resetExpandStats();
});

function rendered(inputs: RuleLane[], spec: WindowSpec) {
  let tree!: ReactTestRenderer;
  function element(nextInputs: RuleLane[], nextSpec: WindowSpec) {
    return createElement(Roster, {
      lanes: expandLanes(nextInputs, windowFor(nextSpec), expandRuleSet),
      windowSpec: nextSpec,
      pxPerMinute: 1,
    });
  }
  act(() => {
    tree = create(element(inputs, spec));
  });
  act(() => {
    tree.root
      .findAll((node) => typeof node.props.onLayout === 'function')[0]
      ?.props.onLayout({
        nativeEvent: { layout: { width: 800, height: 480 } },
      });
  });
  return {
    tree,
    update(nextInputs = inputs, nextSpec = spec) {
      act(() => tree.update(element(nextInputs, nextSpec)));
    },
    geometries(): LaneGeometry[] {
      return tree.root.findAllByType(LaneRow).map((row) => row.props.geometry);
    },
    close() {
      act(() => tree.unmount());
    },
  };
}

function counters() {
  return {
    expanded: expandStats().expanded,
    layout: layoutStats().runs,
    coverage: coverageStats().runs,
  };
}
function delta(before: ReturnType<typeof counters>) {
  const after = counters();
  return {
    expanded: after.expanded - before.expanded,
    layout: after.layout - before.layout,
    coverage: after.coverage - before.coverage,
  };
}
function warm(h: ReturnType<typeof rendered>, inputs: RuleLane[], spec: WindowSpec) {
  const before = counters();
  const hits = {
    expansion: expandStats().cacheHits,
    layout: layoutStats().cacheHits,
    coverage: coverageStats().cacheHits,
  };
  h.update(inputs, spec);
  expect(delta(before)).toEqual({ expanded: 0, layout: 0, coverage: 0 });
  expect(expandStats().cacheHits - hits.expansion).toBe(inputs.length);
  expect(layoutStats().cacheHits - hits.layout).toBe(24);
  // useRoster covers all lanes; layoutLane assembles coverage for mounted lanes.
  expect(coverageStats().cacheHits - hits.coverage).toBe(inputs.length + 24);
}

const transitions = [
  { spec: springWeek, hours: 167, date: '2024-03-10', at: '2024-03-10T08:00:00Z', delta: 60 },
  { spec: fallWeek, hours: 169, date: '2024-11-03', at: '2024-11-03T07:00:00Z', delta: -60 },
];

describe('Chicago DST weeks through the adapter and projections', () => {
  for (const change of transitions) {
    it(`renders ${change.hours} hourly boundaries and places 09:00 against the header across ${change.date}`, () => {
      const input = [ruleLane('Morning', 'America/Chicago')];
      const h = rendered(input, change.spec);
      try {
        const window = windowFor(change.spec);
        const ticks = ticksFor(window, change.spec, horizontal, 60);
        expect(ticks).toHaveLength(change.hours);
        expect(ticks.map(({ time }) => time)).toEqual(
          Array.from({ length: change.hours }, (_, i) => window.start + i * hour),
        );
        const header = h.tree.root.findByProps({ testID: 'roster-header' });
        expect(header.children).toHaveLength(change.hours);
        const sunday = ticks.filter(({ time }) => time >= Date.parse(change.at) - 2 * hour);
        expect(sunday.filter(({ label }) => label === '01:00')).toHaveLength(
          change.delta > 0 ? 1 : 2,
        );
        expect(sunday.filter(({ label }) => label === '02:00')).toHaveLength(
          change.delta > 0 ? 0 : 1,
        );
        const geometry = h.geometries()[0] as LaneGeometry;
        const nine = ticks.filter(({ label }) => label === '09:00');
        expect(nine).toHaveLength(7);
        expect(geometry.rects.map(({ x }) => x)).toEqual(nine.map(({ x }) => x));
        const row = h.tree.root.findByType(LaneRow);
        expect(
          row.findAllByType('View' as ElementType).map((view) => view.props.style[1].left),
        ).toEqual(nine.map(({ x }) => x));
        expect(geometry.rects.map(({ width }) => width)).toEqual(Array(7).fill(60));
        expect((nine[6]?.x ?? NaN) - (nine[5]?.x ?? NaN)).toBe((change.delta > 0 ? 23 : 25) * 60);
      } finally {
        h.close();
      }
    });

    it(`keeps 24 column bands with exactly one ${change.delta > 0 ? 'empty' : 'split'} region in ${change.date}'s week`, () => {
      const window = windowFor(change.spec);
      const days = dayColumnsFor(window, change.spec.timezone);
      const projection: Extract<Projection, { orientation: 'columns' }> = {
        orientation: 'columns',
        viewTimezone: change.spec.timezone,
        pxPerHour: 60,
        columnWidth: 100,
        days,
      };
      expect(days).toHaveLength(7);
      expect(days.flatMap(({ transitions }) => transitions)).toEqual([
        { at: Date.parse(change.at), deltaMinutes: change.delta },
      ]);
      const [full, morning] = expandLanes(
        [ruleLane('Whole day', 'America/Chicago', 0, 24), ruleLane('Morning', 'America/Chicago')],
        window,
        expandRuleSet,
      ) as [Lane, Lane];
      const all = layoutLane(full, window, projection).rects;
      let emptyBands = 0;
      let splitBands = 0;
      for (let column = 0; column < 7; column++) {
        const rects = all.filter((rect) => rect.column === column);
        expect(Math.min(...rects.map(({ y }) => y))).toBe(0);
        expect(Math.max(...rects.map(({ y, height }) => y + height))).toBe(24 * 60);
        for (let band = 0; band < 24; band++) {
          const first = timeAtY(projection, column, band * 60 + 15);
          const second = timeAtY(projection, column, band * 60 + 45);
          const covered = rects.reduce(
            (sum, rect) =>
              sum +
              Math.max(
                0,
                Math.min(rect.y + rect.height, (band + 1) * 60) - Math.max(rect.y, band * 60),
              ),
            0,
          );
          if (first === null || second === null) {
            expect([column, band, covered, first, second]).toEqual([6, 2, 0, null, null]);
            emptyBands++;
          } else {
            expect(covered).toBe(60);
            if (second - first === hour) {
              expect([column, band]).toEqual([6, 1]);
              expect([first, second]).toEqual([
                Date.parse('2024-11-03T06:30:00Z'),
                Date.parse('2024-11-03T07:30:00Z'),
              ]);
              expect(
                rects.filter(({ y }) => y >= 60 && y < 120).map(({ y, height }) => [y, height]),
              ).toEqual([
                [60, 30],
                [90, 30],
              ]);
              splitBands++;
            } else {
              expect(second - first).toBe(hour / 2);
            }
          }
        }
        expect(timeAtY(projection, column, 1440)).toBeNull();
      }
      expect([emptyBands, splitBands]).toEqual(change.delta > 0 ? [1, 0] : [0, 1]);
      expect(
        layoutLane(morning, window, projection).rects.map(({ column, y, height }) => [
          column,
          y,
          height,
        ]),
      ).toEqual(Array.from({ length: 7 }, (_, column) => [column, 540, 60]));
    });
  }
});

describe('rule, lane, and view zones end to end', () => {
  for (const [date, expectedHour, expectedUtc] of [
    ['2024-03-09', 3, '2024-03-09T09:00:00Z'],
    ['2024-03-10', 4, '2024-03-10T09:00:00Z'],
    ['2024-03-31', 3, '2024-03-31T08:00:00Z'],
    ['2024-10-26', 3, '2024-10-26T08:00:00Z'],
    ['2024-10-27', 4, '2024-10-27T09:00:00Z'],
    ['2024-11-03', 3, '2024-11-03T09:00:00Z'],
  ] as const) {
    it(`renders London's 09:00 at Chicago ${expectedHour}:00 on ${date} with the lane badge`, () => {
      const spec: WindowSpec = { span: 'day', anchorDate: date, timezone: 'America/Chicago' };
      const h = rendered([ruleLane('London', 'Europe/London')], spec);
      try {
        const geometry = h.geometries()[0] as LaneGeometry;
        expect(geometry.rects).toHaveLength(1);
        const rect = geometry.rects[0] as Rect;
        expect(windowFor(spec).start + rect.x * 60_000).toBe(Date.parse(expectedUtc));
        expect(rect.sources).toEqual([{ kind: 'rule', id: 'London-daily' }]);
        const header = h.tree.root.findByProps({ testID: 'roster-header' });
        const tick = header
          .findAllByType('Text' as ElementType)
          .find((text) => text.props.children === `0${expectedHour}:00`);
        expect(tick?.parent?.props.style.left).toBe(rect.x);
        const row = h.tree.root.findByType(LaneRow);
        expect(row.findByType('View' as ElementType).props.style[1].left).toBe(rect.x);
        const labels = h.tree.root.findByProps({ testID: 'roster-labels' });
        expect(
          labels.findAllByType('Text' as ElementType).map((text) => text.props.children),
        ).toContain('Europe/London');
        const projection: Extract<Projection, { orientation: 'columns' }> = {
          orientation: 'columns',
          viewTimezone: spec.timezone,
          pxPerHour: 60,
          columnWidth: 100,
          days: dayColumnsFor(windowFor(spec), spec.timezone),
        };
        const lane = row.props.lane as Lane;
        expect(layoutLane(lane, windowFor(spec), projection).rects[0]?.y).toBe(expectedHour * 60);
      } finally {
        h.close();
      }
    });
  }

  it('recomputes 24 visible layouts and all 30 coverage keys on a new view zone, with no expansion', () => {
    const inputs = counterLanes();
    const h = rendered(inputs, springWeek);
    try {
      warm(h, inputs, springWeek);
      const original = h.geometries();
      const target = { ...springWeek, timezone: 'Pacific/Auckland' };
      const before = counters();
      h.update(inputs, target);
      expect(delta(before)).toEqual({ expanded: 0, layout: 24, coverage: 30 });
      expect(
        dayColumnsFor(windowFor(target), target.timezone).map(({ localDate }) => localDate),
      ).toEqual(
        dayColumnsFor(windowFor(springWeek), springWeek.timezone).map(({ localDate }) => localDate),
      );
      warm(h, inputs, target);
      const revisit = counters();
      h.update(inputs, springWeek);
      expect(delta(revisit)).toEqual({ expanded: 0, layout: 0, coverage: 0 });
      h.geometries().forEach((geometry, index) => {
        expect(geometry).toBe(original[index] as LaneGeometry);
      });
    } finally {
      h.close();
    }
  });

  it('changes only the lane badge and retains geometry references with all three run deltas zero', () => {
    const inputs = counterLanes();
    const h = rendered(inputs, springWeek);
    try {
      warm(h, inputs, springWeek);
      const original = h.geometries();
      const before = counters();
      const edited = inputs.map((lane, i) =>
        i === 0 ? { ...lane, timezone: 'Europe/London' } : lane,
      );
      h.update(edited);
      expect(delta(before)).toEqual({ expanded: 0, layout: 0, coverage: 0 });
      h.geometries().forEach((geometry, index) => {
        expect(geometry).toBe(original[index] as LaneGeometry);
      });
      const labels = h.tree.root.findByProps({ testID: 'roster-labels' });
      expect(
        labels
          .findAllByType('Text' as ElementType)
          .filter((text) => text.props.children === 'Europe/London'),
      ).toHaveLength(1);
      warm(h, edited, springWeek);
    } finally {
      h.close();
    }
  });

  for (const index of [0, 29]) {
    it(`changing rule ${index}'s zone expands one rule, covers one lane, and lays out only a visible lane`, () => {
      const inputs = counterLanes();
      const h = rendered(inputs, springWeek);
      try {
        warm(h, inputs, springWeek);
        const original = h.geometries();
        const before = counters();
        const edited = inputs.map((lane, i) =>
          i === index
            ? {
                ...lane,
                set: {
                  ...lane.set,
                  rules: lane.set.rules.map((rule) => ({ ...rule, timezone: 'Asia/Tokyo' })),
                },
              }
            : lane,
        );
        h.update(edited);
        expect(delta(before)).toEqual({ expanded: 1, layout: index < 24 ? 1 : 0, coverage: 1 });
        h.geometries().forEach((geometry, i) => {
          if (i === index) expect(geometry).not.toBe(original[i] as LaneGeometry);
          else expect(geometry).toBe(original[i] as LaneGeometry);
        });
        warm(h, edited, springWeek);
      } finally {
        h.close();
      }
    });
  }

  it('provides DST and mixed-zone gallery fixtures that re-expand for the selected window', () => {
    expect(new Set(mixedZoneLanes.map(({ timezone }) => timezone)).size).toBe(3);
    for (const id of ['dst-week', 'mixed-timezones'] as const) {
      const fixture = rosterFixtures[id];
      expect(fixture.windowSpec).toEqual(springWeek);
      expect(fixture.pxPerMinute).toBe(1);
      expect(fixture.windowPresets?.map(({ windowSpec }) => windowSpec)).toEqual([
        springWeek,
        fallWeek,
      ]);
      for (const spec of [springWeek, fallWeek]) {
        const lanes = expandLanes(fixture.ruleLanes ?? [], windowFor(spec), expandRuleSet);
        expect(lanes).toHaveLength(3);
        expect(
          lanes.every((lane) => lane.complete && (lane.layers[0]?.intervals.length ?? 0) > 0),
        ).toBe(true);
      }
    }
  });
});

function counterLanes(): RuleLane[] {
  return Array.from({ length: 30 }, (_, index) =>
    ruleLane(
      `Lane ${String(index).padStart(2, '0')}`,
      'America/Chicago',
      9 + index / 60,
      10 + index / 60,
    ),
  );
}
