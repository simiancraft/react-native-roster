import type { Window } from '../../core';
import { registerCacheClear } from '../../core/cache';
import { touch, trim } from '../../core/lru';
import { envelopeFor } from './envelope';
import type { ExpandStats } from './types';

export type Occurrences = { spans: Window[]; capped: boolean };
export const occurrences = new Map<string, Occurrences>();
const envelopes = new Map<string, Window>();
const counts: ExpandStats = { rules: 0, dates: 0, expanded: 0, cacheHits: 0, cacheMisses: 0 };

// Envelope retention selects bounds only; no netted result is retained.
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

registerCacheClear(clearExpandCache);
