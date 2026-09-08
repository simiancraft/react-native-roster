export type CounterSnapshot = {
  layout: { runs: number; cacheHits: number };
  coverage: { runs: number; cacheHits: number };
};
export type CounterBridgeInput = {
  layoutStats: () => CounterSnapshot['layout'];
  coverageStats: () => CounterSnapshot['coverage'];
  expandStats?: () => { expanded: number; cacheHits: number };
  resetExpandStats?: () => void;
  clearExpandCache?: () => void;
  resetStats: () => void;
  clearLayoutCache: () => void;
  clearCoverageCache: () => void;
};
