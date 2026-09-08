import { useEffect, useState } from 'react';
import type { Rect, Span, WindowSpec } from 'react-native-roster/core';
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
} from '../../../test/fixtures/roster';
import { expandLanes } from '../../../test/fixtures/timezones';
import { useCounterBridge } from './counter-bridge';
import type { CounterBridgeInput } from './counter-bridge.types';

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
  const [minuteStep, setMinuteStep] = useState(60);
  const [sort, setSort] = useState<'label' | 'availability' | 'availabilityMinusBooking'>('label');
  const [selection, setSelection] = useState('Press an interval, gap, or empty space.');
  const [snapshot, setSnapshot] = useState({
    expanded: 0,
    layout: { runs: 0, cacheHits: 0 },
    coverage: { runs: 0, cacheHits: 0 },
  });
  const fixture = {
    ...definition,
    lanes: definition.ruleLanes
      ? expandLanes(definition.ruleLanes, windowFor(windowSpec), expandRuleSet)
      : definition.lanes,
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
    selection,
    selectRect,
    selectCell: (_lane: unknown, time: number) => setSelection(new Date(time).toISOString()),
  };
}
