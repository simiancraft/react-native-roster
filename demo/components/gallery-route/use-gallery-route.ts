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
} from 'react-native-roster/core';
import {
  type RosterFixtureId,
  rosterFixtures,
  rosterWindowSpec,
} from '../../../test/fixtures/roster';
import { useCounterBridge } from './counter-bridge';
import type { CounterBridgeInput } from './counter-bridge.types';

const counterBridge: CounterBridgeInput = {
  layoutStats,
  coverageStats,
  resetStats,
  clearLayoutCache,
  clearCoverageCache,
};

export function useGalleryRoute(fixtureId: RosterFixtureId) {
  const [windowSpec, setWindowSpec] = useState<WindowSpec>(rosterWindowSpec);
  const [minuteStep, setMinuteStep] = useState(60);
  const [sort, setSort] = useState<'label' | 'availability' | 'availabilityMinusBooking'>('label');
  const [selection, setSelection] = useState('Press an interval, gap, or empty space.');
  const [snapshot, setSnapshot] = useState({
    layout: { runs: 0, cacheHits: 0 },
    coverage: { runs: 0, cacheHits: 0 },
  });
  const fixture = rosterFixtures[fixtureId];
  const sortLanes = sort === 'label' ? byLabel : byCoverage({ measure: sort });
  useEffect(() => {
    const timer = setInterval(() => {
      const layout = layoutStats();
      const coverage = coverageStats();
      setSnapshot((previous) =>
        previous.layout.runs === layout.runs &&
        previous.layout.cacheHits === layout.cacheHits &&
        previous.coverage.runs === coverage.runs &&
        previous.coverage.cacheHits === coverage.cacheHits
          ? previous
          : { layout, coverage },
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
