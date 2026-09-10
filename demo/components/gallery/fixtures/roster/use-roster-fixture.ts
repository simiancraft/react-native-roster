import { useEffect, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type { LaneComparator, Rect, Source, Span, WindowSpec } from 'react-native-roster/core';
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
import {
  type RosterFixtureId,
  rosterFixtures,
  rosterWindowSpec,
} from '../../../../../test/fixtures/roster';
import { useCounterBridge } from '../counter-bridge';
import type { CounterBridgeInput } from '../counter-bridge.types';
import { measureLayout } from './measure-layout';
import { profileStats } from './profile-stats';
import { useRuleSetDraft } from './use-rule-set-draft';
import { fixtureLanes } from './utils/lanes';

type SortKey = 'label' | 'availability' | 'availabilityMinusBooking';
const SORTS: Record<SortKey, LaneComparator> = {
  label: byLabel,
  availability: byCoverage({ measure: 'availability' }),
  availabilityMinusBooking: byCoverage({ measure: 'availabilityMinusBooking' }),
};

const counterBridge: CounterBridgeInput = {
  layoutStats,
  coverageStats,
  resetStats,
  clearLayoutCache,
  clearCoverageCache,
  expandStats,
  resetExpandStats,
  clearExpandCache,
  ...(__DEV__ ? { profileStats } : {}),
};

export function useRosterFixture(fixtureId: RosterFixtureId) {
  const definition = rosterFixtures[fixtureId];
  const [contentWidth, setContentWidth] = useState(720);
  const [windowSpec, setWindowSpec] = useState<WindowSpec>(
    definition.windowSpec ?? rosterWindowSpec,
  );
  const [minuteStep, setMinuteStep] = useState(definition.minuteStep ?? 60);
  const [sort, setSort] = useState<SortKey>('label');
  const [highlightSource, setHighlightSource] = useState<Source>();
  const [selection, setSelection] = useState('Press an interval, gap, or empty space.');
  const [snapshot, setSnapshot] = useState({
    expanded: 0,
    layout: { runs: 0, cacheHits: 0 },
    coverage: { runs: 0, cacheHits: 0 },
  });
  const [ruleHourEnd, setRuleHourEnd] = useState(24);
  const [laneTimezone, setLaneTimezone] = useState('UTC');
  const ruleSetDraft = useRuleSetDraft(definition.ruleSet);
  const expansion = ruleSetDraft.applied
    ? expandRuleSet(ruleSetDraft.applied, windowFor(windowSpec), definition.expandOptions)
    : undefined;
  const fixture = {
    ...definition,
    lanes: fixtureLanes({
      fixtureId,
      definition,
      windowSpec,
      expansion,
      expand: expandRuleSet,
      ruleHourEnd,
      laneTimezone,
    }),
  };
  const sortLanes = SORTS[sort];
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
    contentDirection: contentWidth < 720 ? ('column' as const) : ('row' as const),
    measureContent: (input: LayoutChangeEvent) => setContentWidth(input.nativeEvent.layout.width),
    ruleSetDraft,
    expansion,
    applyRuleSet: () => ruleSetDraft.apply(windowFor(windowSpec), definition.expandOptions),
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
