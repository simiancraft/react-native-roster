// Canonical structural keys retain the full encoding to avoid hash collisions.
// Only layers participate without a version; lane display metadata never does.
import type { Lane, Projection, ScopedCacheIdentity, Window } from './types';

const scopedCacheKeys = new WeakMap<ScopedCacheIdentity, number>();
let nextScopedCacheKey = 0;

export function structuralKey(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(structuralKey).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${structuralKey(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) as string;
}

export function laneKey(lane: Lane, window: Window, cacheIdentity: ScopedCacheIdentity): string {
  let cacheKey = scopedCacheKeys.get(cacheIdentity);
  if (cacheKey === undefined) {
    cacheKey = nextScopedCacheKey++;
    scopedCacheKeys.set(cacheIdentity, cacheKey);
  }
  return JSON.stringify([
    cacheKey,
    lane.id,
    lane.version === undefined ? ['layers', structuralKey(lane.layers)] : ['version', lane.version],
    window.start,
    window.end,
  ]);
}

export function projectionKey(projection: Projection): string {
  return structuralKey(projection);
}
