import { useEffect, useState } from 'react';
import type { Rect, Source, Span, WindowSpec } from 'react-native-roster/core';
import {
  byCoverage,
  byLabel,
  clearCoverageCache,
  clearLayoutCache,
  coverageStats,
  layoutStats,
  resetStats,
  windowFor,
} from 'react-native-roster/core';
import {
  clearExpandCache,
  expandRuleSet,
  expandStats,
  resetExpandStats,
} from 'react-native-roster/rrule';
import { performanceLanes } from '../../../test/fixtures/performance-lanes';
import {
  type RosterFixtureId,
  rosterFixtures,
  rosterWindowSpec,
} from '../../../test/fixtures/roster';
import { expandLanes } from '../../../test/fixtures/timezones';
import { useCounterBridge } from './counter-bridge';
import type { CounterBridgeInput } from './counter-bridge.types';
import { measureLayout } from './measure-layout';

const counterBridge: CounterBridgeInput = {
  layoutStats,
  coverageStats,
  resetStats,
  clearLayoutCache,
  clearCoverageCache,
  expandStats,
  resetExpandStats,
  clearExpandCache,
};

export function useGalleryRoute(fixtureId: RosterFixtureId) {
  const definition = rosterFixtures[fixtureId];
  const [windowSpec, setWindowSpec] = useState<WindowSpec>(
    definition.windowSpec ?? rosterWindowSpec,
  );
  const [minuteStep, setMinuteStep] = useState(fixtureId === '200-lanes' ? 15 : 60);
  const [sort, setSort] = useState<'label' | 'availability' | 'availabilityMinusBooking'>('label');
  const [highlightSource, setHighlightSource] = useState<Source>();
  const [selection, setSelection] = useState('Press an interval, gap, or empty space.');
  const [snapshot, setSnapshot] = useState({
    expanded: 0,
    layout: { runs: 0, cacheHits: 0 },
    coverage: { runs: 0, cacheHits: 0 },
  });
  const [ruleHourEnd, setRuleHourEnd] = useState(24);
  const [laneTimezone, setLaneTimezone] = useState('UTC');
  const fixture = {
    ...definition,
    lanes:
      fixtureId === '200-lanes' && windowSpec.span !== 'custom'
        ? performanceLanes(
            windowFor(windowSpec),
            windowSpec.anchorDate,
            expandRuleSet,
            ruleHourEnd,
            laneTimezone,
          )
        : (definition.lanesFor?.(windowFor(windowSpec), expandRuleSet) ??
          (definition.ruleLanes
            ? expandLanes(definition.ruleLanes, windowFor(windowSpec), expandRuleSet)
            : definition.lanes)),
  };
  const sortLanes = sort === 'label' ? byLabel : byCoverage({ measure: sort });
  useEffect(() => {
    const timer = setInterval(() => {
      const { expanded } = expandStats();
      const layout = layoutStats();
      const coverage = coverageStats();
      setSnapshot((previous) =>
        previous.expanded === expanded &&
        previous.layout.runs === layout.runs &&
        previous.layout.cacheHits === layout.cacheHits &&
        previous.coverage.runs === coverage.runs &&
        previous.coverage.cacheHits === coverage.cacheHits
          ? previous
          : { expanded, layout, coverage },
      );
    }, 500);
    return () => clearInterval(timer);
  }, []);
  useCounterBridge(counterBridge);
  function setSpan(span: Span) {
    setWindowSpec((previous) => ({
      span,
      anchorDate: previous.span === 'custom' ? '2024-01-01' : previous.anchorDate,
      timezone: previous.timezone,
    }));
  }
  function setTimezone(timezone: string) {
    setWindowSpec((previous) => ({ ...previous, timezone }));
  }
  function selectRect(rect: Rect) {
    setSelection(JSON.stringify(rect.sources));
  }
  return {
    status: 'ready' as const,
    fixtureId,
    measureColdLayout: () =>
      setSelection(measureLayout(fixture.lanes, windowFor(windowSpec), windowSpec.timezone)),
    changeRule: () => setRuleHourEnd((hour) => (hour === 24 ? 10 : 24)),
    changeLaneTimezone: () =>
      setLaneTimezone((zone) => (zone === 'UTC' ? 'Pacific/Auckland' : 'UTC')),
    fixture,
    windowSpec,
    setWindowSpec,
    setSpan,
    setTimezone,
    minuteStep,
    setMinuteStep,
    sort,
    setSort,
    sortLanes,
    snapshot,
    highlightSource,
    highlightRule: () =>
      setHighlightSource(definition.highlightSource && { ...definition.highlightSource }),
    clearHighlight: () => setHighlightSource(undefined),
    selection,
    selectRect,
    selectCell: (_lane: unknown, time: number) => setSelection(new Date(time).toISOString()),
  };
}
