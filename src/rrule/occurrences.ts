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

type RuleDateTime = TemporalModule.Temporal.PlainDateTime | TemporalModule.Temporal.ZonedDateTime;

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
  const original = dateTime(input.dtstart, input.timezone);
  const originalWall = plain(original);
  const upper = Temporal.Instant.fromEpochMilliseconds(envelope.end)
    .toZonedDateTimeISO(input.timezone)
    .add({ days: 1 })
    .startOfDay();
  const until =
    input.until === undefined
      ? upper.toPlainDateTime()
      : dateTime(input.until, input.timezone, true);
  const untilDate =
    input.until !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(input.until)
      ? Temporal.PlainDate.from(input.until)
      : undefined;
  if (
    !untilDate &&
    (until instanceof Temporal.ZonedDateTime
      ? Temporal.ZonedDateTime.compare(
          until,
          anchorFor(original.toPlainDate(), original, input.timezone),
        ) < 0
      : Temporal.PlainDateTime.compare(until, originalWall) < 0)
  )
    return result;
  const anchorWallTime = original.toPlainTime();
  // Iterate wall dates in UTC so zone skips cannot normalize a candidate date.
  // The callback applies the original date cutoff or the exact datetime UNTIL.
  const untilDateEnd = (untilDate ?? until.toPlainDate())
    // An instant after a midnight rollback can have the preceding local date.
    // Keep the later wall date available for the callback's exact-instant filter.
    .add({ days: until instanceof Temporal.ZonedDateTime ? 1 : 0 })
    .toPlainDateTime('23:59:59.999')
    .toZonedDateTime('UTC');
  const upperDate = upper.toPlainDateTime().toZonedDateTime('UTC');
  // Only midnight anchors with interval 1 and no COUNT may skip periods.
  const anchor =
    advanceAnchor &&
    (input.interval === undefined || input.interval === 1) &&
    input.count === undefined &&
    anchorWallTime.equals('00:00')
      ? advance(originalWall, envelope, input)
      : originalWall;
  const engine = new RRuleTemporal({
    freq: input.frequency,
    dtstart: anchor.toZonedDateTime('UTC'),
    until: Temporal.ZonedDateTime.compare(untilDateEnd, upperDate) < 0 ? untilDateEnd : upperDate,
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
    tzid: 'UTC',
    includeDtstart: false,
    // The finite upper bound stops sparse rules; the callback enforces our cap.
    maxIterations: Number.POSITIVE_INFINITY,
  });
  // Version 1.5.2 can replay the iterator when applying its final count filter.
  // Admit each local date once so replay cannot consume COUNT or the cap twice.
  const visited = new Set<string>();
  let admitted = 0;
  engine.all((occurrence) => {
    if (result.capped || admitted === input.count) return false;
    const date = occurrence.toPlainDate();
    const key = date.toString();
    if (visited.has(key)) return true;
    visited.add(key);
    if (untilDate) {
      if (Temporal.PlainDate.compare(date, untilDate) > 0) return true;
    } else if (
      until instanceof Temporal.ZonedDateTime
        ? Temporal.ZonedDateTime.compare(anchorFor(date, original, input.timezone), until) > 0
        : Temporal.PlainDateTime.compare(date.toPlainDateTime(anchorWallTime), until) > 0
    )
      return true;
    if (!date.toZonedDateTime(input.timezone).toPlainDate().equals(date)) return true;
    // Lifetime COUNT includes existing dates before the envelope, but never skipped dates.
    admitted++;
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
  plain(dateTime(input.dtstart, input.timezone)).toZonedDateTime(input.timezone);
  if (input.until !== undefined)
    plain(dateTime(input.until, input.timezone, true)).toZonedDateTime(input.timezone);
}

function hoursFor(date: TemporalModule.Temporal.PlainDate, input: RosterRule | RosterDate): Window {
  const midnight = date.toPlainDateTime();
  const dayStart = date.toZonedDateTime(input.timezone);
  if (!dayStart.toPlainDate().equals(date)) {
    return { start: dayStart.epochMilliseconds, end: dayStart.epochMilliseconds };
  }
  const wholeDay = input.hourstart === undefined && input.hourend === undefined;
  // Whole-day bounds resolve PlainDates to first instants. Explicit hours use
  // compatible wall time, choosing the earlier repeat and advancing skips.
  const at = (hour: number) => {
    const wall = midnight.add({ milliseconds: Math.round(hour * 3_600_000) });
    return (wholeDay ? wall.toPlainDate() : wall).toZonedDateTime(input.timezone).epochMilliseconds;
  };
  return { start: at(input.hourstart ?? 0), end: at(input.hourend ?? 24) };
}

function dateTime(value: string, timezone: string, endOfDate = false): RuleDateTime {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = Temporal.PlainDate.from(value);
    return date.toPlainDateTime(endOfDate ? '23:59:59.999' : '00:00');
  }
  if (/(?:Z|[+-]\d{2}:?\d{2})(?:\[.*\])?$/i.test(value)) {
    return Temporal.Instant.from(value).toZonedDateTimeISO(timezone);
  }
  return Temporal.PlainDateTime.from(value);
}

function plain(value: RuleDateTime): TemporalModule.Temporal.PlainDateTime {
  return value instanceof Temporal.ZonedDateTime ? value.toPlainDateTime() : value;
}

// Keep the original wall time and back up one period so WKST/BYDAY cannot lose
// an earlier candidate. A monthly jump must never constrain the 31st to the 28th.
function advance(
  original: TemporalModule.Temporal.PlainDateTime,
  envelope: Window,
  input: RosterRule,
): TemporalModule.Temporal.PlainDateTime {
  // Include the local date crossing the left edge, regardless of anchor wall time.
  const lower = Temporal.Instant.fromEpochMilliseconds(envelope.start)
    .toZonedDateTimeISO(input.timezone)
    .startOfDay();
  const unit =
    input.frequency === 'MONTHLY' ? 'months' : input.frequency === 'WEEKLY' ? 'weeks' : 'days';
  const originalDate = original.toPlainDate();
  const interval = input.interval ?? 1;
  const distance = originalDate.until(lower.toPlainDate(), { largestUnit: unit })[unit];
  let steps = Math.max(0, Math.floor(distance / interval) - 1);
  while (steps > 0) {
    const candidate = originalDate.add({ [unit]: steps * interval });
    if (
      (unit !== 'weeks' || candidate.dayOfWeek === originalDate.dayOfWeek) &&
      (unit !== 'months' || candidate.day === originalDate.day) &&
      candidate.toZonedDateTime(input.timezone).toPlainDate().equals(candidate)
    )
      return candidate.toPlainDateTime(original.toPlainTime());
    steps--;
  }
  return original;
}

// Prefer the original offset in repeated time; otherwise resolve skips compatibly.
function anchorFor(
  date: TemporalModule.Temporal.PlainDate,
  original: RuleDateTime,
  timezone: string,
): TemporalModule.Temporal.ZonedDateTime {
  return original instanceof Temporal.ZonedDateTime
    ? original.with({ year: date.year, month: date.month, day: date.day }, { offset: 'prefer' })
    : date.toPlainDateTime(original.toPlainTime()).toZonedDateTime(timezone);
}
