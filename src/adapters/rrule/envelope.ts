import type { Window } from '../../core';

// Absolute 48-hour padding exceeds the 26-hour difference between view zones.
// Includes, excludes, and dates share these bounds before subtraction.
export function envelopeFor(window: Window): Window {
  return { start: window.start - 48 * 3_600_000, end: window.end + 48 * 3_600_000 };
}
