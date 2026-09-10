import { useEffect, useState } from 'react';
import type { Rect, ScheduleWindowSpec, WindowSpec } from 'react-native-roster';
import {
  clearCoverageCache,
  clearLayoutCache,
  coverageStats,
  layoutStats,
  resetStats,
} from 'react-native-roster/core';
import { clearExpandCache, expandStats, resetExpandStats } from 'react-native-roster/rrule';
import {
  type ScheduleFixtureId,
  scheduleFixtures,
  scheduleLane,
} from '../../../../../test/fixtures/schedule';
import { useCounterBridge } from '../counter-bridge';
import type { CounterBridgeInput } from '../counter-bridge.types';

const bridge: CounterBridgeInput = {
  layoutStats,
  coverageStats,
  resetStats,
  clearLayoutCache,
  clearCoverageCache,
  expandStats,
  resetExpandStats,
  clearExpandCache,
};

export function useScheduleFixture(fixtureId: ScheduleFixtureId) {
  const fixture = scheduleFixtures[fixtureId];
  const [windowSpec, setWindowSpec] = useState<ScheduleWindowSpec>(fixture.windowSpec);
  const [zoneStyle, setZoneStyle] = useState<'defaults' | 'replacements'>('defaults');
  const [pxPerHour, setPxPerHour] = useState(48);
  const [minuteStep, setMinuteStep] = useState(60);
  const [view, setView] = useState<'roster' | 'schedule' | 'both'>(
    fixtureId === 'schedule-side-by-side' ? 'both' : 'schedule',
  );
  const [selection, setSelection] = useState('Press an interval, gap, or empty space.');
  const [snapshot, setSnapshot] = useState({
    layout: { runs: 0, cacheHits: 0 },
    coverage: { runs: 0, cacheHits: 0 },
    expansion: { rules: 0, dates: 0, expanded: 0, cacheHits: 0, cacheMisses: 0 },
  });
  useCounterBridge(bridge);
  useEffect(() => {
    const timer = setInterval(
      () =>
        setSnapshot({ layout: layoutStats(), coverage: coverageStats(), expansion: expandStats() }),
      500,
    );
    return () => clearInterval(timer);
  }, []);
  const lane = scheduleLane(fixtureId, windowSpec);
  function navigate(next: WindowSpec) {
    if (next.span === 'day' || next.span === 'week') setWindowSpec({ ...next, span: next.span });
  }
  return {
    status: 'ready' as const,
    zoneStyle,
    setZoneStyle,
    showsZoneExamples: fixtureId === 'schedule-every-zone',
    fixture,
    lane,
    windowSpec,
    minuteStep,
    setMinuteStep,
    pxPerHour,
    setPxPerHour,
    view,
    setView,
    snapshot,
    selection,
    navigate,
    setSpan: (span: 'day' | 'week') => setWindowSpec({ ...windowSpec, span }),
    setTimezone: (timezone: string) => setWindowSpec({ ...windowSpec, timezone }),
    selectRect: (rect: Rect) => setSelection(JSON.stringify(rect.sources)),
    selectCell: (_lane: unknown, time: number) => setSelection(new Date(time).toISOString()),
  };
}
