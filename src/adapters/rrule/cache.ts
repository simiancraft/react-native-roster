import type { Window } from '../../core';
import { envelopeFor } from './envelope';
import type { ExpandStats } from './types';

export type Occurrences = { spans: Window[]; capped: boolean };
export const occurrences = new Map<string, Occurrences>();
const envelopes = new Map<string, Window>();
const counts: ExpandStats = { rules: 0, dates: 0, expanded: 0, cacheHits: 0, cacheMisses: 0 };

// Map insertion order is the LRU: reads move entries to the newest end.
// Envelope retention selects bounds only; no netted result is retained.
export function touch<T>(cache: Map<string, T>, key: string, value: T): T {
  cache.delete(key);
  cache.set(key, value);
  return value;
}

export function trim<T>(cache: Map<string, T>, limit: number): void {
  while (cache.size > limit) cache.delete(cache.keys().next().value as string);
}

export function retainedEnvelope(window: Window, limit: number): Window {
  trim(envelopes, limit);
  for (const [id, envelope] of [...envelopes].reverse()) {
    if (envelope.start <= window.start && envelope.end >= window.end) {
      return touch(envelopes, id, envelope);
    }
  }
  const envelope = envelopeFor(window);
  touch(envelopes, JSON.stringify(envelope), envelope);
  trim(envelopes, limit);
  return envelope;
}

export function recordStats(stats: ExpandStats): void {
  for (const key of Object.keys(counts) as Array<keyof ExpandStats>) counts[key] += stats[key];
}

export function expandStats(): ExpandStats {
  return { ...counts };
}

export function resetExpandStats(): void {
  for (const key of Object.keys(counts) as Array<keyof ExpandStats>) counts[key] = 0;
}

export function clearExpandCache(): void {
  occurrences.clear();
  envelopes.clear();
}
