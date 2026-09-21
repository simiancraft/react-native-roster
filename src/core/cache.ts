import type { Coverage, LaneFlag, LaneGeometry, Rect, ScopedCacheIdentity } from './types';

export const defaultScopedCacheIdentity: ScopedCacheIdentity = {};
export const layoutCacheLimit = 2_000;
export const coverageCacheLimit = 2_000;

type LayoutCache = Map<
  string,
  {
    rects: Rect[];
    gapRects: Rect[];
    assemblies: WeakMap<Coverage, Map<LaneFlag, LaneGeometry>>;
  }
>;

let layoutCaches = new WeakMap<ScopedCacheIdentity, LayoutCache>();
let coverageCaches = new WeakMap<ScopedCacheIdentity, Map<string, Coverage>>();
const registeredCacheClears = new Set<() => void>();
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

export function layoutCacheFor(cacheIdentity: ScopedCacheIdentity): LayoutCache {
  let cache = layoutCaches.get(cacheIdentity);
  if (!cache) {
    cache = new Map();
    layoutCaches.set(cacheIdentity, cache);
  }
  return cache;
}

export function coverageCacheFor(cacheIdentity: ScopedCacheIdentity): Map<string, Coverage> {
  let cache = coverageCaches.get(cacheIdentity);
  if (!cache) {
    cache = new Map();
    coverageCaches.set(cacheIdentity, cache);
  }
  return cache;
}

export function clearLayoutCache(): void {
  layoutCaches = new WeakMap();
}

export function clearCoverageCache(): void {
  coverageCaches = new WeakMap();
}

export function registerCacheClear(clear: () => void): () => void {
  registeredCacheClears.add(clear);
  return () => registeredCacheClears.delete(clear);
}

export function clearCaches(): void {
  clearLayoutCache();
  clearCoverageCache();
  for (const clear of registeredCacheClears) clear();
}
