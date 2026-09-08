import type { Coverage, Lane } from './types';

export type LaneComparator = (a: Lane, b: Lane, coverage: ReadonlyMap<string, Coverage>) => number;

export function byLabel(a: Lane, b: Lane): number {
  return a.label.localeCompare(b.label);
}

export function byCoverage({
  measure,
}: {
  measure: 'availability' | 'availabilityMinusBooking';
}): LaneComparator {
  const field =
    measure === 'availability' ? 'availabilityMinutes' : 'availabilityMinusBookingMinutes';
  return (a, b, coverage) =>
    (coverage.get(b.id)?.[field] ?? 0) - (coverage.get(a.id)?.[field] ?? 0) || byLabel(a, b);
}
