import { counts, coverageCache } from './cache';
import { laneKey } from './hash';
import type { Coverage, Lane, LayerRole, Window } from './types';

export function coverageFor(lane: Lane, window: Window): Coverage {
  const key = laneKey(lane, window);
  const cached = coverageCache.get(key);
  if (cached) {
    counts.coverage.cacheHits++;
    return cached;
  }
  counts.coverage.runs++;
  const available = union(lane, window, 'availability');
  const booked = union(lane, window, 'booking');
  let intersection = 0;
  let a = 0;
  let b = 0;
  while (a < available.length && b < booked.length) {
    const left = available[a] as Window;
    const right = booked[b] as Window;
    intersection += Math.max(0, Math.min(left.end, right.end) - Math.max(left.start, right.start));
    if (left.end < right.end) a++;
    else b++;
  }
  const availabilityMinutes = duration(available) / 60_000;
  const result = {
    availabilityMinutes,
    bookingMinutes: duration(booked) / 60_000,
    availabilityMinusBookingMinutes: availabilityMinutes - intersection / 60_000,
  };
  coverageCache.set(key, result);
  return result;
}

function union(lane: Lane, window: Window, role: LayerRole): Window[] {
  const spans = lane.layers
    .filter((layer) => layer.role === role)
    .flatMap((layer) => layer.intervals)
    .map(({ start, end }) => ({
      start: Math.max(start, window.start),
      end: Math.min(end, window.end),
    }))
    .filter(({ start, end }) => start < end)
    .sort((a, b) => a.start - b.start);
  const result: Window[] = [];
  for (const span of spans) {
    const last = result.at(-1);
    if (last && span.start <= last.end) last.end = Math.max(last.end, span.end);
    else result.push(span);
  }
  return result;
}

function duration(spans: Window[]): number {
  return spans.reduce((sum, span) => sum + span.end - span.start, 0);
}
