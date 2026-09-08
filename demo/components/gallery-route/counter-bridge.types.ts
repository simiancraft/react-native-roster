import type { ExpandStats } from 'react-native-roster/rrule';

export type CounterSnapshot = {
  expanded: number;
  layout: { runs: number; cacheHits: number };
  coverage: { runs: number; cacheHits: number };
};
export type CounterBridgeInput = {
  profileStats?: () => {
    body: { mounts: number; updates: number };
    lanes: Record<string, { mounts: number; updates: number }>;
  };
  layoutStats: () => CounterSnapshot['layout'];
  coverageStats: () => CounterSnapshot['coverage'];
  expandStats?: () => ExpandStats;
  resetExpandStats?: () => void;
  clearExpandCache?: () => void;
  resetStats: () => void;
  clearLayoutCache: () => void;
  clearCoverageCache: () => void;
};
