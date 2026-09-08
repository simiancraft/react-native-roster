import type { Coverage, LaneFlag, LaneGeometry, Rect } from './types';

export const layoutCache = new Map<
  string,
  {
    rects: Rect[];
    gapRects: Rect[];
    assemblies: WeakMap<Coverage, Map<LaneFlag, LaneGeometry>>;
  }
>();
export const coverageCache = new Map<string, Coverage>();
export const counts = {
  layout: { runs: 0, cacheHits: 0 },
  coverage: { runs: 0, cacheHits: 0 },
};

export function layoutStats(): { runs: number; cacheHits: number } {
  return { ...counts.layout };
}

export function coverageStats(): { runs: number; cacheHits: number } {
  return { ...counts.coverage };
}

export function resetStats(): void {
  counts.layout.runs = 0;
  counts.layout.cacheHits = 0;
  counts.coverage.runs = 0;
  counts.coverage.cacheHits = 0;
}

export function clearLayoutCache(): void {
  layoutCache.clear();
}

export function clearCoverageCache(): void {
  coverageCache.clear();
}
