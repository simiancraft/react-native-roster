import type * as TemporalModule from '@js-temporal/polyfill';
import type * as RRuleModule from 'rrule-temporal' with { 'resolution-mode': 'import' };
import type { Weekday, Window } from '../../core';
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
  // A cross-date rollback can leave the end on the preceding wall date.
  // Include the following date completely; envelope clipping discards extra candidates.
  const upper = Temporal.Instant.fromEpochMilliseconds(envelope.end)
    .toZonedDateTimeISO(input.timezone)
    .add({ days: 2 })
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
  const positional = !!input.bysetpos?.length;
  const unit = periodUnit(input);
  const firstPeriod = periodStart(anchor.toPlainDate(), input);
  const bound =
    Temporal.ZonedDateTime.compare(untilDateEnd, upperDate) < 0 ? untilDateEnd : upperDate;
  const lastPeriod = periodStart(bound.toPlainDate(), input);
  if (Temporal.PlainDate.compare(firstPeriod, lastPeriod) > 0) return result;
  // 1.5.2 tests UNTIL only while visiting candidates in its monthly loop.
  // Every supported loop advances at least one authored period per iteration.
  // Exhaustion after the final query period is complete, even with no candidates.
  const maxIterations =
    Math.floor(firstPeriod.until(lastPeriod, { largestUnit: unit })[unit] / (input.interval ?? 1)) +
    1;
  const engine = new RRuleTemporal({
    freq: input.frequency,
    dtstart: firstPeriod.toPlainDateTime(anchorWallTime).toZonedDateTime('UTC'),
    // Positions must see the entire final period before UNTIL and envelope admission.
    until: positional
      ? lastPeriod
          .add({ [unit]: 1 })
          .toZonedDateTime('UTC')
          .subtract({ milliseconds: 1 })
      : bound,
    interval: input.interval,
    wkst: allowedWeekdays[input.wkst ?? 0],
    byDay:
      input.frequency !== 'DAILY' && input.byweekday?.length
        ? input.byweekday.map((day) => allowedWeekdays[day])
        : input.frequency === 'WEEKLY' && !input.bymonthday?.length
          ? [allowedWeekdays[(original.dayOfWeek - 1) as Weekday]]
          : undefined,
    byMonth: input.bymonth,
    // Explicitly preserve the implicit monthly day; 1.5.2's fallback otherwise
    // constrains a 31st through February and drifts subsequent months.
    byMonthDay: input.bymonthday?.length
      ? input.bymonthday
      : input.frequency === 'MONTHLY' && !input.byweekday?.length
        ? [original.day]
        : undefined,
    tzid: 'UTC',
    includeDtstart: false,
    maxIterations,
  });
  // Version 1.5.2 can replay the iterator when applying its final count filter.
  // Admit each local date once so replay cannot consume COUNT or the cap twice.
  const visited = new Set<string>();
  let admitted = 0;
  const visit = (date: TemporalModule.Temporal.PlainDate): boolean => {
    if (result.capped || admitted === input.count) return false;
    if (Temporal.PlainDate.compare(date, original.toPlainDate()) < 0) return true;
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
  };
  let candidateCount = 0;
  let period = '';
  let candidates: TemporalModule.Temporal.PlainDate[] = [];
  const flush = (): boolean => {
    const selected = candidates.filter((_, index) =>
      input.bysetpos?.some((position) =>
        position > 0 ? index === position - 1 : index === candidates.length + position,
      ),
    );
    candidates = [];
    return selected.every(visit);
  };
  try {
    engine.all((occurrence, index) => {
      const date = occurrence.toPlainDate();
      // Replayed callback indices restart at zero. They must not enlarge a
      // buffered period, especially when the whole query has only one candidate.
      if (positional && index < candidateCount) return false;
      candidateCount++;
      // DAILY BYDAY re-anchors the engine; filter the authored sequence here.
      if (
        input.frequency === 'DAILY' &&
        input.byweekday?.length &&
        !input.byweekday.includes((date.dayOfWeek - 1) as Weekday)
      )
        return true;
      if (!positional) return visit(date);
      const key = periodStart(date, input).toString();
      if (key !== period) {
        if (!flush()) return false;
        period = key;
      }
      candidates.push(date);
      return true;
    });
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !== `Maximum iterations (${maxIterations}) exceeded in all()`
    )
      throw error;
  }
  flush();
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
  if (/(?:Z|[+-]\d{2}:?\d{2})(?:\[[^\]]*\])?$/i.test(value)) {
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

function periodUnit(input: RosterRule): 'days' | 'weeks' | 'months' {
  return input.frequency === 'MONTHLY' ? 'months' : input.frequency === 'WEEKLY' ? 'weeks' : 'days';
}

function periodStart(
  date: TemporalModule.Temporal.PlainDate,
  input: RosterRule,
): TemporalModule.Temporal.PlainDate {
  if (input.frequency === 'MONTHLY') return date.with({ day: 1 });
  if (input.frequency === 'WEEKLY')
    return date.subtract({ days: (date.dayOfWeek - 1 - (input.wkst ?? 0) + 7) % 7 });
  return date;
}
