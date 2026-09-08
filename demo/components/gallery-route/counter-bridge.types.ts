import type { ExpandStats } from 'react-native-roster/rrule';

export type CounterSnapshot = {
  expanded: number;
  layout: { runs: number; cacheHits: number };
  coverage: { runs: number; cacheHits: number };
};
export type CounterBridgeInput = {
  layoutStats: () => CounterSnapshot['layout'];
  coverageStats: () => CounterSnapshot['coverage'];
  expandStats?: () => ExpandStats;
  resetExpandStats?: () => void;
  clearExpandCache?: () => void;
  resetStats: () => void;
  clearLayoutCache: () => void;
  clearCoverageCache: () => void;
};
