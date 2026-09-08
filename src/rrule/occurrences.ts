import type * as TemporalModule from '@js-temporal/polyfill';
import type * as RRuleModule from 'rrule-temporal' with { 'resolution-mode': 'import' };
import type { Window } from '../core';
import type { Occurrences } from './cache';
import type { RosterDate, RosterRule } from './types';

// 1.5.2 ships a CJS runtime but ESM-only declarations. Keep its actual types
// while selecting the require export for our CJS build and Metro source entry.
const { allowedWeekdays, RRuleTemporal } = require('rrule-temporal') as typeof RRuleModule;
// Both engines must use the same polyfill export; mixed import/require copies
// fail the recurrence engine's ZonedDateTime instanceof check.
const { Temporal } = require('@js-temporal/polyfill') as typeof TemporalModule;

export function enumerate(
  input: RosterRule | RosterDate,
  envelope: Window,
  cap: number,
  // Internal reference path for testing against original-anchor enumeration.
  advanceAnchor = true,
): Occurrences {
  const result: Occurrences = { spans: [], capped: false };
  const admit = (date: TemporalModule.Temporal.PlainDate): boolean => {
    const span = hoursFor(date, input);
    if (span.start >= envelope.end || span.end <= envelope.start || span.start >= span.end)
      return true;
    if (result.spans.length === cap) {
      result.capped = true;
      return false;
    }
    result.spans.push(span);
    return true;
  };
  if ('date' in input) {
    admit(Temporal.PlainDate.from(input.date));
    return result;
  }
  const original = zoned(input.dtstart, input.timezone);
  const upper = Temporal.Instant.fromEpochMilliseconds(envelope.end)
    .toZonedDateTimeISO(input.timezone)
    .add({ days: 1 })
    .startOfDay();
  const until = input.until === undefined ? upper : zoned(input.until, input.timezone, true);
  const engine = new RRuleTemporal({
    freq: input.frequency,
    // Only interval 1 preserves filtered phase; COUNT needs its lifetime anchor.
    dtstart:
      advanceAnchor &&
      (input.interval === undefined || input.interval === 1) &&
      input.count === undefined
        ? advance(original, envelope, input)
        : original,
    until: Temporal.ZonedDateTime.compare(until, upper) < 0 ? until : upper,
    count: input.count,
    interval: input.interval,
    wkst: allowedWeekdays[input.wkst ?? 0],
    byDay: input.byweekday?.map((day) => allowedWeekdays[day]),
    byMonth: input.bymonth,
    // Explicitly preserve the implicit monthly day; 1.5.2's fallback otherwise
    // constrains a 31st through February and drifts subsequent months.
    byMonthDay: input.bymonthday?.length
      ? input.bymonthday
      : input.frequency === 'MONTHLY' && !input.byweekday?.length
        ? [original.day]
        : undefined,
    bySetPos: input.bysetpos,
    tzid: input.timezone,
    includeDtstart: false,
    // The finite upper bound stops sparse rules; the callback enforces our cap.
    maxIterations: Number.POSITIVE_INFINITY,
  });
  // Version 1.5.2 can replay the iterator when applying its final count filter.
  // Admit each local date once so replay cannot consume the cap twice.
  const visited = new Set<string>();
  engine.all((occurrence) => {
    if (result.capped) return false;
    const date = occurrence.toPlainDate();
    const key = date.toString();
    if (visited.has(key)) return true;
    visited.add(key);
    return admit(date);
  });
  return result;
}

// Validate temporal fields even when the display window has no elapsed time.
export function validateDates(input: RosterRule | RosterDate): void {
  if ('date' in input) {
    Temporal.PlainDate.from(input.date).toZonedDateTime(input.timezone);
    return;
  }
  zoned(input.dtstart, input.timezone);
  if (input.until !== undefined) zoned(input.until, input.timezone, true);
}

function hoursFor(date: TemporalModule.Temporal.PlainDate, input: RosterRule | RosterDate): Window {
  const midnight = date.toPlainDateTime();
  const dayStart = date.toZonedDateTime(input.timezone);
  if (!dayStart.toPlainDate().equals(date)) {
    return { start: dayStart.epochMilliseconds, end: dayStart.epochMilliseconds };
  }
  // Add wall-clock milliseconds before resolving the zone, including hour 24.
  // Temporal's compatible policy chooses the earlier repeat and advances skips.
  const at = (hour: number) =>
    midnight.add({ milliseconds: Math.round(hour * 3_600_000) }).toZonedDateTime(input.timezone)
      .epochMilliseconds;
  return { start: at(input.hourstart ?? 0), end: at(input.hourend ?? 24) };
}

function zoned(
  value: string,
  timezone: string,
  endOfDate = false,
): TemporalModule.Temporal.ZonedDateTime {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = Temporal.PlainDate.from(value);
    return date.toPlainDateTime(endOfDate ? '23:59:59.999' : '00:00').toZonedDateTime(timezone);
  }
  if (/(?:Z|[+-]\d{2}:?\d{2})(?:\[.*\])?$/i.test(value)) {
    return Temporal.Instant.from(value).toZonedDateTimeISO(timezone);
  }
  return Temporal.PlainDateTime.from(value).toZonedDateTime(timezone);
}

// Keep the original wall time and back up one period so WKST/BYDAY cannot lose
// an earlier candidate. A monthly jump must never constrain the 31st to the 28th.
function advance(
  original: TemporalModule.Temporal.ZonedDateTime,
  envelope: Window,
  input: RosterRule,
): TemporalModule.Temporal.ZonedDateTime {
  // Include the local date crossing the left edge, regardless of anchor wall time.
  const lower = Temporal.Instant.fromEpochMilliseconds(envelope.start)
    .toZonedDateTimeISO(input.timezone)
    .startOfDay();
  const unit =
    input.frequency === 'MONTHLY' ? 'months' : input.frequency === 'WEEKLY' ? 'weeks' : 'days';
  const distance = original.toPlainDate().until(lower.toPlainDate(), { largestUnit: unit })[unit];
  let steps = Math.max(0, distance - 1);
  while (steps > 0) {
    const candidate = original.add({ [unit]: steps });
    if (unit !== 'months' || candidate.day === original.day) return candidate;
    steps--;
  }
  return original;
}
