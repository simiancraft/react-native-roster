import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import type * as TemporalModule from '@js-temporal/polyfill';
import type * as RRuleModule from 'rrule-temporal' with { 'resolution-mode': 'import' };
import type { RosterDate, RosterRule, RuleSet } from '../../../src/adapters/rrule';
import {
  clearExpandCache,
  envelopeFor,
  expandRuleSet,
  expandStats,
  resetExpandStats,
} from '../../../src/adapters/rrule';
import { enumerate } from '../../../src/adapters/rrule/occurrences';
import type { Interval, Weekday, Window } from '../../../src/core';
import { windowFor } from '../../../src/core';

const { Temporal } = require('@js-temporal/polyfill') as typeof TemporalModule;
const { RRuleTemporal, allowedWeekdays } = require('rrule-temporal') as typeof RRuleModule;

const hour = 3_600_000;
const epoch = Date.parse;
const window = { start: epoch('2024-03-04T00:00Z'), end: epoch('2024-03-11T00:00Z') };
function rule(overrides: Partial<RosterRule> = {}): RosterRule {
  return {
    id: 'a',
    kind: 'include',
    frequency: 'DAILY',
    dtstart: '2024-01-01',
    hourstart: 9,
    hourend: 17,
    timezone: 'UTC',
    ...overrides,
  };
}
function date(overrides: Partial<RosterDate> = {}): RosterDate {
  return { id: 'd', kind: 'include', date: '2024-03-05', timezone: 'UTC', ...overrides };
}
function set(rules: RosterRule[] = [rule()], dates: RosterDate[] = [date()]): RuleSet {
  return { rules, dates };
}
function shift(window: Window, hours: number): Window {
  return { start: window.start + hours * hour, end: window.end + hours * hour };
}
function span(start: string, end: string, kind: string, ...ids: string[]): Interval {
  return { start: epoch(start), end: epoch(end), sources: ids.map((id) => ({ kind, id })) };
}
beforeEach(() => {
  clearExpandCache();
  resetExpandStats();
});

describe('retained envelope right boundaries across date rollbacks', () => {
  for (const sample of [
    {
      timezone: 'America/Goose_Bay',
      dtstart: '1988-10-20T12:00',
      seedStart: '1988-10-28T00:00Z',
      seedEnd: '1988-10-28T03:00Z',
      targetStart: '1988-10-30T02:00Z',
      targetEnd: '1988-10-30T03:00Z',
      laterUntil: '1988-11-30',
      earlierUntil: '1988-10-29',
    },
    {
      timezone: 'America/St_Johns',
      dtstart: '2009-10-20T12:00',
      seedStart: '2009-10-30T00:00Z',
      seedEnd: '2009-10-30T03:00Z',
      targetStart: '2009-11-01T02:30Z',
      targetEnd: '2009-11-01T03:00Z',
      laterUntil: '2009-11-30',
      earlierUntil: '2009-10-31',
    },
  ]) {
    for (const bysetpos of [undefined, [1]]) {
      for (const until of [undefined, sample.laterUntil, sample.earlierUntil]) {
        it(`matches cold expansion in ${sample.timezone}, BYSETPOS ${bysetpos ?? 'absent'}, UNTIL ${until ?? 'absent'}`, () => {
          const input = set(
            [
              rule({
                id: 'r',
                timezone: sample.timezone,
                dtstart: sample.dtstart,
                hourstart: 0,
                hourend: 1,
                bysetpos,
                until,
              }),
            ],
            [],
          );
          const target = { start: epoch(sample.targetStart), end: epoch(sample.targetEnd) };
          const seed = expandRuleSet(input, {
            start: epoch(sample.seedStart),
            end: epoch(sample.seedEnd),
          });
          const retained = expandRuleSet(input, target);
          expect(retained.envelope).toEqual(seed.envelope);
          expect(retained.stats).toMatchObject({ expanded: 0, cacheHits: 1 });
          clearExpandCache();
          const cold = expandRuleSet(input, target);
          expect(cold.intervals).toEqual(
            until === sample.earlierUntil
              ? []
              : [span(sample.targetStart, sample.targetEnd, 'rule', 'r')],
          );
          expect(cold.complete).toBe(true);
          expect(retained.intervals).toEqual(cold.intervals);
          expect(retained.complete).toBe(cold.complete);
          expect(retained.gaps).toEqual(cold.gaps);
          expect(retained.truncated).toEqual([]);
        });
      }
    }
  }

  it('discards extra UTC candidates before cap admission at the envelope end', () => {
    const input = rule({ dtstart: '2024-03-01T12:00', hourstart: 0, hourend: 1 });
    const envelope = { start: epoch('2024-03-04T00:00Z'), end: epoch('2024-03-05T00:00Z') };
    expect(enumerate(input, envelope, 1)).toEqual({
      spans: [{ start: envelope.start, end: envelope.start + hour }],
      capped: false,
    });
  });
});

describe('rule-local expansion and netting', () => {
  it('pads each edge by exactly 48 elapsed hours', () => {
    expect(envelopeFor(window)).toEqual({
      start: window.start - 48 * hour,
      end: window.end + 48 * hour,
    });
  });

  for (const [start, end, before, after] of [
    ['2024-03-08T00:00Z', '2024-03-13T00:00Z', '2024-03-08T15:00Z', '2024-03-11T14:00Z'],
    ['2024-11-01T00:00Z', '2024-11-06T00:00Z', '2024-11-01T14:00Z', '2024-11-04T15:00Z'],
  ]) {
    it(`keeps both edges of Chicago weekly hours across DST at ${start}`, () => {
      const authored = windowFor({
        span: 'custom',
        timezone: 'Pacific/Auckland',
        window: {
          start: windowFor({
            span: 'day',
            anchorDate: (start as string).slice(0, 10),
            timezone: 'Pacific/Auckland',
          }).start,
          end: windowFor({
            span: 'day',
            anchorDate: (end as string).slice(0, 10),
            timezone: 'Pacific/Auckland',
          }).start,
        },
      });
      const output = expandRuleSet(
        set([rule({ frequency: 'WEEKLY', byweekday: [0, 4], timezone: 'America/Chicago' })], []),
        authored,
      );
      expect(output.intervals.map(({ start, end }) => [start, end])).toEqual([
        [epoch(before as string), epoch(before as string) + 8 * hour],
        [epoch(after as string), epoch(after as string) + 8 * hour],
      ]);
    });
  }

  it('nets a middle exclusion with includes only on intervals and excludes only on gaps', () => {
    const output = expandRuleSet(
      set(
        [
          rule({ count: 1, dtstart: '2024-03-05' }),
          rule({
            id: 'x',
            kind: 'exclude',
            count: 1,
            dtstart: '2024-03-05',
            hourstart: 11,
            hourend: 13,
          }),
        ],
        [],
      ),
      window,
    );
    expect(output.intervals).toEqual([
      span('2024-03-05T09:00Z', '2024-03-05T11:00Z', 'rule', 'a'),
      span('2024-03-05T13:00Z', '2024-03-05T17:00Z', 'rule', 'a'),
    ]);
    expect(output.gaps).toEqual([span('2024-03-05T11:00Z', '2024-03-05T13:00Z', 'rule', 'x')]);
  });

  it('retains a fully excluded day and adds a date with no rule', () => {
    const output = expandRuleSet(
      set(
        [rule({ count: 1, dtstart: '2024-03-05', hourstart: 0, hourend: 24 })],
        [
          date({ kind: 'exclude' }),
          date({
            id: 'extra',
            date: '2024-03-06',
            hourstart: 10,
            hourend: 12,
            note: 'extra hours',
          }),
        ],
      ),
      window,
    );
    expect(output.gaps).toEqual([span('2024-03-05T00:00Z', '2024-03-06T00:00Z', 'date', 'd')]);
    expect(output.intervals).toEqual([
      {
        ...span('2024-03-06T10:00Z', '2024-03-06T12:00Z', 'date', 'extra'),
        sources: [{ kind: 'date', id: 'extra', label: 'extra hours' }],
      },
    ]);
  });

  it('keeps exact include and exclude source sets through overlaps and touching bounds', () => {
    const output = expandRuleSet(
      set(
        [],
        [
          date({ id: 'a', hourstart: 9, hourend: 11 }),
          date({ id: 'b', hourstart: 10, hourend: 12 }),
          date({ id: 'x', kind: 'exclude', hourstart: 10.5, hourend: 11.5 }),
          date({ id: 'y', kind: 'exclude', hourstart: 11, hourend: 12 }),
          date({ id: 'z', kind: 'exclude', hourstart: 0, hourend: 9 }),
        ],
      ),
      window,
    );
    expect(output.intervals).toEqual([
      span('2024-03-05T09:00Z', '2024-03-05T10:00Z', 'date', 'a'),
      span('2024-03-05T10:00Z', '2024-03-05T10:30Z', 'date', 'a', 'b'),
    ]);
    expect(output.gaps).toEqual([
      span('2024-03-05T10:30Z', '2024-03-05T11:00Z', 'date', 'x'),
      span('2024-03-05T11:00Z', '2024-03-05T11:30Z', 'date', 'x', 'y'),
      span('2024-03-05T11:30Z', '2024-03-05T12:00Z', 'date', 'y'),
    ]);
  });

  it('an exclusion anchored 30 hours before the window still trims an include starting inside it', () => {
    // Apia repeated 1892-07-04 in full; this local day lasts 48 absolute hours.
    const anchor = epoch('1892-07-03T11:26:56Z');
    const window = { start: anchor + 30 * hour, end: anchor + 40 * hour };
    const output = expandRuleSet(
      set(
        [
          rule({ dtstart: '1892-07-04', count: 1, hourstart: 18, hourend: 22 }),
          rule({
            id: 'x',
            kind: 'exclude',
            dtstart: '1892-07-04',
            count: 1,
            timezone: 'Pacific/Apia',
            hourstart: 0,
            hourend: 24,
          }),
        ],
        [],
      ),
      window,
    );
    expect(output.intervals).toEqual([]);
    expect(output.gaps).toEqual([span('1892-07-04T18:00Z', '1892-07-04T22:00Z', 'rule', 'x')]);
    expect(output.complete).toBe(true);
  });

  it('preserves subminute precision and clips both display edges', () => {
    const start = epoch('2024-03-05T09:00:00.123Z');
    const output = expandRuleSet(set([], [date({ hourstart: 9, hourend: 9 + 1 / 3600 })]), {
      start,
      end: start + 456,
    });
    expect(output.intervals).toEqual([
      { start, end: start + 456, sources: [{ kind: 'date', id: 'd' }] },
    ]);
  });

  it('does not make gaps from exclusions outside includes', () => {
    expect(expandRuleSet(set([], [date({ kind: 'exclude' })]), window).gaps).toEqual([]);
    expect(expandRuleSet(set([], []), window).complete).toBe(true);
  });

  it('reuses a date crossing the selected envelope left edge', () => {
    const first = expandRuleSet(set([], [date({ date: '2024-03-02' })]), shift(window, 12));
    const output = expandRuleSet(set([], [date({ date: '2024-03-02' })]), {
      start: first.envelope.start,
      end: first.envelope.start + hour,
    });
    expect(output.stats.expanded).toBe(0);
    expect(output.intervals).toHaveLength(1);
  });
});

describe('occurrence and envelope caches', () => {
  it('reuses the same set and a 26-hour shift, then expands an 8-day shift', () => {
    const input = set();
    const first = expandRuleSet(input, window);
    expect(expandRuleSet(input, window).stats).toEqual({
      rules: 1,
      dates: 1,
      expanded: 0,
      cacheHits: 2,
      cacheMisses: 0,
    });
    const shifted = expandRuleSet(input, shift(window, 26));
    expect(shifted.envelope).toEqual(first.envelope);
    expect(shifted.stats.expanded).toBe(0);
    expect(expandRuleSet(input, shift(window, -26)).stats.expanded).toBe(0);
    expect(expandRuleSet(input, shift(window, 8 * 24)).stats.expanded).toBe(2);
    expect(expandRuleSet(input, window).stats.expanded).toBe(0);
  });

  it('reuses unchanged bodies after a contained view-zone change and an edit', () => {
    const a = rule({ id: 'A' });
    const b = rule({ id: 'B', hourstart: 10 });
    const input = set([a, b], []);
    const chicago = windowFor({
      span: 'week',
      anchorDate: '2024-03-04',
      timezone: 'America/Chicago',
    });
    const first = expandRuleSet(input, window);
    const second = expandRuleSet(input, chicago);
    const edited = expandRuleSet(set([{ ...a, hourend: 18 }, b], []), chicago);
    expect([first.stats.expanded, second.stats.expanded, edited.stats.expanded]).toEqual([2, 0, 1]);
    expect(edited.stats.cacheHits).toBe(1);
    expect(edited.envelope).toEqual(first.envelope);
  });

  it('shares the envelope budget across sets and selects the most recently used containment', () => {
    const first = expandRuleSet(set([rule({ id: 'A' })], []), window);
    const newer = expandRuleSet(set([rule({ id: 'B', hourend: 18 })], []), shift(window, 72));
    const contained = shift(window, 36);
    expect(expandRuleSet(set(), contained).envelope).toEqual(newer.envelope);
    expandRuleSet(set(), window);
    expect(expandRuleSet(set(), contained).envelope).toEqual(first.envelope);
    for (let i = 1; i <= 4; i++) {
      expandRuleSet(
        set([rule({ id: String(i), hourend: 18 + i })], []),
        shift(window, i * 20 * 24),
      );
    }
    expect(expandRuleSet(set(), shift(window, 1)).envelope).not.toEqual(first.envelope);
  });

  it('retains next week and previous week and does not cache total-cap assembly', () => {
    const input = set();
    expandRuleSet(input, window);
    expect(expandRuleSet(input, shift(window, 7 * 24)).stats.expanded).toBe(2);
    expect(expandRuleSet(input, window).stats.expanded).toBe(0);
    const limited = expandRuleSet(input, window, { caps: { totalOccurrences: 0 } });
    expect(limited.stats.expanded).toBe(0);
    expect(limited.truncated).toEqual([
      { id: 'a', droppedAtLeast: 11 },
      { id: 'd', droppedAtLeast: 1 },
    ]);
    expect(expandRuleSet(input, window).truncated).toEqual([]);
  });

  it('evicts the first envelope on the fifth distinct visit, and refreshes LRU on reads', () => {
    const input = set();
    const first = expandRuleSet(input, window);
    for (let i = 1; i <= 4; i++) expandRuleSet(input, shift(window, i * 20 * 24));
    // A shifted window would reuse the first envelope if it were still retained.
    expect(expandRuleSet(input, shift(window, 1)).envelope).not.toEqual(first.envelope);
    clearExpandCache();
    expandRuleSet(input, window);
    for (let i = 1; i < 4; i++) expandRuleSet(input, shift(window, i * 20 * 24));
    expandRuleSet(input, window);
    expandRuleSet(input, shift(window, 80 * 24));
    expect(expandRuleSet(input, shift(window, 1)).envelope).toEqual(first.envelope);
  });

  it('honors custom envelope limits and zero retention', () => {
    const input = set();
    expandRuleSet(input, window);
    expandRuleSet(input, shift(window, 30 * 24), { cache: { maxEnvelopes: 1 } });
    expect(expandRuleSet(input, shift(window, 1)).envelope).toEqual(envelopeFor(shift(window, 1)));
    expandRuleSet(input, window, { cache: { maxEnvelopes: 0 } });
    expect(expandRuleSet(input, shift(window, 2)).envelope).toEqual(envelopeFor(shift(window, 2)));
  });

  it('changes one body only, then invalidates all entries for a per-rule cap change', () => {
    const input = set([rule(), rule({ id: 'b', hourstart: 8 })]);
    expandRuleSet(input, window);
    input.rules[0] = rule({ timezone: 'America/Chicago' });
    expect(expandRuleSet(input, window).stats.expanded).toBe(1);
    expect(expandRuleSet(input, window, { caps: { perRuleOccurrences: 2 } }).stats.expanded).toBe(
      3,
    );
    expect(expandRuleSet(input, window, { caps: { perRuleOccurrences: 2 } }).stats.expanded).toBe(
      0,
    );
  });

  it('separates identity from content, handles property order, and assembles current labels', () => {
    expandRuleSet(set([], [date({ id: 'old', note: 'old' })]), window);
    const output = expandRuleSet(
      set([], [{ timezone: 'UTC', date: '2024-03-05', kind: 'include', id: 'new', note: 'new' }]),
      window,
    );
    expect(output.stats.cacheHits).toBe(1);
    expect(output.intervals[0]?.sources).toEqual([{ kind: 'date', id: 'new', label: 'new' }]);
    const twins = expandRuleSet(set([rule({ id: 'same' }), rule({ id: 'same' })], []), window);
    expect(twins.intervals[0]?.sources).toEqual([{ kind: 'rule', id: 'same' }]);
  });

  it('evicts least recently used per-rule entries and supports disabled caching', () => {
    const a = set([rule()], []);
    const b = set([rule({ id: 'b', hourstart: 8 })], []);
    const c = set([rule({ id: 'c', hourstart: 7 })], []);
    const opts = { cache: { maxEntries: 2 } };
    expandRuleSet(a, window, opts);
    expandRuleSet(b, window, opts);
    expandRuleSet(a, window, opts);
    expandRuleSet(c, window, opts);
    expect(expandRuleSet(a, window, opts).stats.cacheHits).toBe(1);
    expect(expandRuleSet(b, window, opts).stats.expanded).toBe(1);
    expect(expandRuleSet(b, window, { cache: { maxEntries: 0 } }).stats.expanded).toBe(1);
    expect(expandRuleSet(b, window, { cache: { maxEntries: 0 } }).stats.expanded).toBe(1);
  });

  it('snapshots counters, clears caches independently, and returns detached results', () => {
    const output = expandRuleSet(set(), window);
    output.envelope.start = 0;
    output.intervals[0]?.sources.push({ kind: 'date', id: 'bad' });
    const counts = expandStats();
    expect(counts).toEqual(output.stats);
    resetExpandStats();
    expect(expandStats().expanded).toBe(0);
    expect(counts.expanded).toBe(2);
    const reused = expandRuleSet(set(), window);
    expect(reused.envelope).toEqual(envelopeFor(window));
    expect(reused.intervals.some((span) => span.sources.some(({ id }) => id === 'bad'))).toBe(
      false,
    );
    clearExpandCache();
    expect(expandStats().cacheHits).toBe(2);
    expect(expandRuleSet(set(), window).stats.expanded).toBe(2);
  });
});

describe('caps', () => {
  it('stops a 10,000-occurrence daily rule at the per-rule cap', () => {
    // The contract has no subdaily frequency; 10,000 occurrences require a longer window.
    const output = expandRuleSet(set([rule({ count: 10000 })], []), {
      start: epoch('2024-01-01'),
      end: epoch('2052-01-01'),
    });
    expect(output.complete).toBe(false);
    expect(output.truncated).toEqual([{ id: 'a', droppedAtLeast: 1 }]);
    expect(output.intervals).toHaveLength(400);
  });

  it('admits an exact fit, drops one over whole, and drops every later rule then date', () => {
    const input = set([
      rule({ id: 'c', count: 1, dtstart: '2024-03-05', hourstart: 7 }),
      rule({ id: 'b', count: 2, dtstart: '2024-03-05', hourstart: 8 }),
      rule({ id: 'a', count: 2, dtstart: '2024-03-05' }),
    ]);
    const exact = expandRuleSet(input, window, { caps: { totalOccurrences: 4 } });
    expect(exact.truncated).toEqual([
      { id: 'c', droppedAtLeast: 1 },
      { id: 'd', droppedAtLeast: 1 },
    ]);
    const over = expandRuleSet(input, window, { caps: { totalOccurrences: 3 } });
    expect(over.stats.expanded).toBe(0);
    expect(over.truncated).toEqual([
      { id: 'b', droppedAtLeast: 2 },
      { id: 'c', droppedAtLeast: 1 },
      { id: 'd', droppedAtLeast: 1 },
    ]);
    expect(over.intervals.every((span) => span.sources.every(({ id }) => id === 'a'))).toBe(true);
  });

  it('detects only actual per-rule overflow, including dates and zero caps', () => {
    const input = set([rule({ count: 2, dtstart: '2024-03-05' })], []);
    expect(expandRuleSet(input, window, { caps: { perRuleOccurrences: 2 } }).complete).toBe(true);
    expect(expandRuleSet(input, window, { caps: { perRuleOccurrences: 1 } }).truncated).toEqual([
      { id: 'a', droppedAtLeast: 1 },
    ]);
    const zero = expandRuleSet(set(), window, { caps: { perRuleOccurrences: 0 } });
    expect(zero.truncated).toEqual([
      { id: 'a', droppedAtLeast: 1 },
      { id: 'd', droppedAtLeast: 1 },
    ]);
    expect(zero.intervals).toEqual([]);
    expect(
      expandRuleSet(set([], [date({ date: '2020-01-01' })]), window, {
        caps: { perRuleOccurrences: 0 },
      }).complete,
    ).toBe(true);
    expect(
      expandRuleSet(input, window, { caps: { perRuleOccurrences: 1, totalOccurrences: 0 } })
        .truncated,
    ).toEqual([{ id: 'a', droppedAtLeast: 1 }]);
  });
});

describe('recurrence fields and local boundaries', () => {
  for (const broadFirst of [false, true]) {
    for (const [timezone, dtstart, weekday, weeklyStarts, monthlyStarts] of [
      [
        'Pacific/Apia',
        '2011-12-30',
        4,
        ['2012-01-05T19:00Z', '2012-01-12T19:00Z'],
        ['2012-01-29T19:00Z', '2012-03-29T19:00Z'],
      ],
      [
        'Pacific/Fakaofo',
        '2011-12-30',
        4,
        ['2012-01-05T20:00Z', '2012-01-12T20:00Z'],
        ['2012-01-29T20:00Z', '2012-03-29T20:00Z'],
      ],
      [
        'Pacific/Kwajalein',
        '1993-08-21',
        5,
        ['1993-08-27T21:00Z', '1993-09-03T21:00Z'],
        ['1993-09-20T21:00Z', '1993-10-20T21:00Z'],
      ],
    ] as const) {
      for (const localTime of ['', 'T02:30']) {
        for (const frequency of ['WEEKLY', 'MONTHLY'] as const) {
          for (const explicit of [false, true]) {
            it(`preserves skipped DTSTART ${dtstart}${localTime} in ${timezone}, ${frequency}, explicit ${explicit}, broad first ${broadFirst}`, () => {
              const input = rule({
                timezone,
                dtstart: `${dtstart}${localTime}`,
                frequency,
                count: 2,
                hourend: 10,
                ...(explicit
                  ? frequency === 'WEEKLY'
                    ? { byweekday: [weekday] }
                    : { bymonthday: [Number(dtstart.slice(-2))] }
                  : {}),
              });
              const starts = frequency === 'WEEKLY' ? weeklyStarts : monthlyStarts;
              const expected = starts.map((start) => ({
                start: epoch(start),
                end: epoch(start) + hour,
                sources: [{ kind: 'rule', id: 'a' }],
              }));
              const window = { start: epoch(dtstart), end: epoch(starts[1]) + 24 * hour };
              const broad = {
                start: window.start - 14 * 24 * hour,
                end: window.end + 14 * 24 * hour,
              };
              for (const advanceAnchor of [false, true]) {
                expect(enumerate(input, window, 400, advanceAnchor)).toEqual({
                  spans: expected.map(({ start, end }) => ({ start, end })),
                  capped: false,
                });
              }
              if (broadFirst)
                expect(expandRuleSet(set([input], []), broad).intervals).toEqual(expected);
              const output = expandRuleSet(set([input], []), window);
              expect(output.intervals).toEqual(expected);
              expect(output.complete).toBe(true);
              expect(output.stats.expanded).toBe(broadFirst ? 0 : 1);
              expect(expandRuleSet(set([input], []), broad).intervals).toEqual(expected);
              const retained = expandRuleSet(set([input], []), window);
              expect(retained.intervals).toEqual(expected);
              expect(retained.complete).toBe(true);
              expect(retained.stats.expanded).toBe(0);
            });
          }
        }
      }
    }

    for (const dtstart of ['2024-03-09T02:30', '2024-03-10T02:30']) {
      for (const [until, included] of [
        ['2024-03-11T03:00', true],
        ['2024-03-11T02:30', true],
        ['2024-03-11T02:29', false],
        ['2024-03-11T07:30Z', true],
        ['2024-03-11T07:29Z', false],
      ] as const) {
        it(`preserves skipped anchor wall time for ${dtstart}, UNTIL ${until}, broad first ${broadFirst}`, () => {
          const input = set([rule({ timezone: 'America/Chicago', dtstart, until })], []);
          const window = windowFor({
            span: 'day',
            anchorDate: '2024-03-11',
            timezone: 'America/Chicago',
          });
          const broad = { start: epoch('2024-03-08'), end: epoch('2024-03-15') };
          const expected = included
            ? [span('2024-03-11T14:00Z', '2024-03-11T22:00Z', 'rule', 'a')]
            : [];
          if (broadFirst) expect(expandRuleSet(input, broad).complete).toBe(true);
          const output = expandRuleSet(input, window);
          expect(output.intervals).toEqual(expected);
          expect(output.complete).toBe(true);
          expect(output.stats.expanded).toBe(broadFirst ? 0 : 1);
          expect(expandRuleSet(input, broad).complete).toBe(true);
          const retained = expandRuleSet(input, window);
          expect(retained.intervals).toEqual(expected);
          expect(retained.complete).toBe(true);
          expect(retained.stats.expanded).toBe(0);
        });
      }
    }

    for (const [dtstart, until, included] of [
      ['2024-03-09T02:30', '2024-03-10T03:00', true],
      ['2024-03-10T02:30', '2024-03-10T03:00', true],
      ['2024-03-09T03:00', '2024-03-10T02:30', false],
      ['2024-03-10T03:00', '2024-03-10T02:30', false],
    ] as const) {
      it(`compares local UNTIL across a skipped hour without normalization, ${dtstart}, ${until}, broad first ${broadFirst}`, () => {
        const input = set([rule({ timezone: 'America/Chicago', dtstart, until })], []);
        const window = windowFor({
          span: 'day',
          anchorDate: '2024-03-10',
          timezone: 'America/Chicago',
        });
        const broad = { start: epoch('2024-03-08'), end: epoch('2024-03-15') };
        const expected = included
          ? [span('2024-03-10T14:00Z', '2024-03-10T22:00Z', 'rule', 'a')]
          : [];
        if (broadFirst) expandRuleSet(input, broad);
        const output = expandRuleSet(input, window);
        expect(output.intervals).toEqual(expected);
        expect(output.complete).toBe(true);
        expect(output.stats.expanded).toBe(broadFirst ? 0 : 1);
        expandRuleSet(input, broad);
        const retained = expandRuleSet(input, window);
        expect(retained.intervals).toEqual(expected);
        expect(retained.complete).toBe(true);
        expect(retained.stats.expanded).toBe(0);
      });
    }
  }

  for (const count of [undefined, 5]) {
    for (const broadFirst of [false, true]) {
      for (const kind of ['include', 'exclude'] as const) {
        it(`preserves Apia Fridays across a skipped date, ${kind}, COUNT ${count}, broad first ${broadFirst}`, () => {
          const input = set(
            [
              rule({
                id: 'friday',
                kind,
                frequency: 'WEEKLY',
                dtstart: '2011-12-16',
                byweekday: [4],
                count,
                timezone: 'Pacific/Apia',
              }),
            ],
            kind === 'exclude'
              ? [
                  date({
                    id: 'saturday',
                    date: '2011-12-31',
                    timezone: 'Pacific/Apia',
                    hourstart: 9,
                    hourend: 17,
                  }),
                ]
              : [],
          );
          const window = { start: epoch('2011-12-15T00:00Z'), end: epoch('2012-01-21T00:00Z') };
          const broad = { start: epoch('2011-12-01T00:00Z'), end: epoch('2012-02-04T00:00Z') };
          const fridays = [
            span('2011-12-16T19:00Z', '2011-12-17T03:00Z', 'rule', 'friday'),
            span('2011-12-23T19:00Z', '2011-12-24T03:00Z', 'rule', 'friday'),
            span('2012-01-05T19:00Z', '2012-01-06T03:00Z', 'rule', 'friday'),
            span('2012-01-12T19:00Z', '2012-01-13T03:00Z', 'rule', 'friday'),
            span('2012-01-19T19:00Z', '2012-01-20T03:00Z', 'rule', 'friday'),
          ];
          const expected =
            kind === 'include'
              ? fridays
              : [span('2011-12-30T19:00Z', '2011-12-31T03:00Z', 'date', 'saturday')];
          if (broadFirst) expect(expandRuleSet(input, broad).complete).toBe(true);
          const output = expandRuleSet(input, window);
          expect(output.intervals).toEqual(expected);
          expect(output.gaps).toEqual([]);
          expect(output.complete).toBe(true);
          expect(output.truncated).toEqual([]);
          expect(output.stats.expanded).toBe(
            broadFirst ? 0 : input.rules.length + input.dates.length,
          );
          const expanded = expandRuleSet(input, broad);
          expect(expanded.complete).toBe(true);
          expect(expanded.gaps).toEqual([]);
          expect(expanded.intervals).toEqual(
            kind === 'include' && count === undefined
              ? [
                  ...fridays,
                  span('2012-01-26T19:00Z', '2012-01-27T03:00Z', 'rule', 'friday'),
                  span('2012-02-02T19:00Z', '2012-02-03T03:00Z', 'rule', 'friday'),
                ]
              : expected,
          );
          const retained = expandRuleSet(input, window);
          expect(retained.intervals).toEqual(expected);
          expect(retained.gaps).toEqual([]);
          expect(retained.complete).toBe(true);
          expect(retained.stats.expanded).toBe(0);
        });
      }
    }
  }

  for (const [timezone, dtstart, until] of [
    ['America/Chicago', '2024-03-01T02:30', '2024-05-31'],
    ['Pacific/Apia', '2011-12-16T00:00', '2012-03-31'],
    ['America/Santiago', '2024-09-01T00:00', '2024-11-30'],
    ['Asia/Kathmandu', '1985-12-16T00:00', '1986-03-31'],
  ] as const) {
    const samples: Partial<RosterRule>[] = [
      {},
      { interval: 2 },
      { frequency: 'WEEKLY', byweekday: [4], wkst: 6 },
      { frequency: 'WEEKLY', interval: 2, byweekday: [0, 4], wkst: 6 },
      { frequency: 'MONTHLY', bymonthday: [1, 16, -1] },
      { frequency: 'MONTHLY', byweekday: [0, 1, 2, 3, 4], bysetpos: [-1], bymonth: [3, 11, 12] },
    ];
    for (const [index, sample] of samples.entries()) {
      for (const count of [undefined, 5]) {
        it(`matches UTC plain-date enumeration after nonexistent dates are dropped in ${timezone}, sample ${index}, COUNT ${count}`, () => {
          const input = rule({ timezone, dtstart, until, ...sample, count });
          const reference = new RRuleTemporal({
            freq: input.frequency,
            dtstart: Temporal.PlainDateTime.from(dtstart).toZonedDateTime('UTC'),
            until: Temporal.PlainDate.from(until)
              .toPlainDateTime('23:59:59.999')
              .toZonedDateTime('UTC'),
            tzid: 'UTC',
            includeDtstart: false,
            interval: input.interval,
            wkst: allowedWeekdays[input.wkst ?? 0],
            byDay: input.byweekday?.map((day) => allowedWeekdays[day]),
            byMonthDay: input.bymonthday,
            byMonth: input.bymonth,
            bySetPos: input.bysetpos,
          });
          const expected = [
            ...new Set(reference.all().map((value) => value.toPlainDate().toString())),
          ]
            .filter((value) => {
              const date = Temporal.PlainDate.from(value);
              return date.toZonedDateTime(timezone).toPlainDate().equals(date);
            })
            .slice(0, count);
          expect(expected.length).toBeGreaterThan(0);
          const window = {
            start: Temporal.PlainDateTime.from(dtstart).toPlainDate().toZonedDateTime(timezone)
              .epochMilliseconds,
            end: Temporal.PlainDate.from(until).add({ days: 1 }).toZonedDateTime(timezone)
              .epochMilliseconds,
          };
          for (const advanceAnchor of [false, true]) {
            const output = enumerate(input, window, 400, advanceAnchor);
            expect(output.capped).toBe(false);
            expect(
              output.spans.map(({ start }) =>
                Temporal.Instant.fromEpochMilliseconds(start)
                  .toZonedDateTimeISO(timezone)
                  .toPlainDate()
                  .toString(),
              ),
            ).toEqual(expected);
          }
        });
      }
    }
  }

  for (const [timezone, dtstart, until, anchorDate, controlDate, start, end] of [
    [
      'America/Nuuk',
      '2024-03-01',
      '2024-03-30',
      '2024-03-31',
      '2024-03-30',
      '2024-03-30T11:00Z',
      '2024-03-30T19:00Z',
    ],
    [
      'Pacific/Apia',
      '2011-12-01',
      '2011-12-30',
      '2011-12-31',
      '2011-12-29',
      '2011-12-29T19:00Z',
      '2011-12-30T03:00Z',
    ],
    [
      'Pacific/Kwajalein',
      '1993-08-01',
      '1993-08-21',
      '1993-08-22',
      '1993-08-20',
      '1993-08-20T21:00Z',
      '1993-08-21T05:00Z',
    ],
  ] as const) {
    for (const retained of [false, true]) {
      it(`rejects dates after date-only UNTIL in ${timezone}, retained ${retained}`, () => {
        const input = set([rule({ timezone, dtstart, until })], []);
        const window = windowFor({ span: 'day', anchorDate, timezone });
        if (retained)
          expandRuleSet(input, {
            start: window.start - 14 * 24 * hour,
            end: window.end + 7 * 24 * hour,
          });
        const output = expandRuleSet(input, window);
        expect(output.intervals).toEqual([]);
        expect(output.gaps).toEqual([]);
        expect(output.complete).toBe(true);
        expect(output.stats.expanded).toBe(retained ? 0 : 1);
      });
      it(`admits the date-only UNTIL date in ${timezone}, retained ${retained}`, () => {
        const input = set([rule({ timezone, dtstart, until: controlDate })], []);
        const window = windowFor({ span: 'day', anchorDate: controlDate, timezone });
        if (retained)
          expandRuleSet(input, {
            start: window.start - 14 * 24 * hour,
            end: window.end + 7 * 24 * hour,
          });
        const output = expandRuleSet(input, window);
        expect(output.intervals).toEqual([span(start, end, 'rule', 'a')]);
        expect(output.complete).toBe(true);
        expect(output.stats.expanded).toBe(retained ? 0 : 1);
      });
    }
  }

  for (const [timezone, anchorDate, anchorInstant, after, start, end] of [
    [
      'America/St_Johns',
      '2009-11-01',
      '2009-11-01T02:30Z',
      '2009-11-01T02:40Z',
      '2009-11-01T12:30Z',
      '2009-11-01T13:30Z',
    ],
    [
      'America/Goose_Bay',
      '1988-10-30',
      '1988-10-30T02:00Z',
      '1988-10-30T02:10Z',
      '1988-10-30T13:00Z',
      '1988-10-30T14:00Z',
    ],
    [
      'UTC',
      '2024-03-05',
      '2024-03-05T00:00Z',
      '2024-03-05T00:10Z',
      '2024-03-05T09:00Z',
      '2024-03-05T10:00Z',
    ],
  ] as const) {
    const before = new Date(epoch(anchorInstant) - 1).toISOString();
    for (const dtstart of [anchorInstant, `${anchorDate}T00:00`]) {
      for (const count of [undefined, 1]) {
        for (const until of [before, anchorInstant, after]) {
          for (const kind of ['include', 'exclude'] as const) {
            for (const broadFirst of [false, true]) {
              it(`applies exact-instant UNTIL in ${timezone}, ${dtstart}, ${until}, ${kind}, COUNT ${count}, broad first ${broadFirst}`, () => {
                const input = set(
                  [rule({ id: 'cutoff', timezone, dtstart, until, kind, count, hourend: 10 })],
                  kind === 'exclude'
                    ? [date({ date: anchorDate, timezone, hourstart: 9, hourend: 10 })]
                    : [],
                );
                const window = windowFor({ span: 'day', anchorDate, timezone });
                const broad = {
                  start: window.start - 14 * 24 * hour,
                  end: window.end + 7 * 24 * hour,
                };
                const admitted = until !== before;
                const intervals =
                  kind === 'include'
                    ? admitted
                      ? [span(start, end, 'rule', 'cutoff')]
                      : []
                    : admitted
                      ? []
                      : [span(start, end, 'date', 'd')];
                const gaps =
                  kind === 'exclude' && admitted ? [span(start, end, 'rule', 'cutoff')] : [];
                if (broadFirst) expect(expandRuleSet(input, broad).complete).toBe(true);
                const output = expandRuleSet(input, window);
                expect(output.intervals).toEqual(intervals);
                expect(output.gaps).toEqual(gaps);
                expect(output.complete).toBe(true);
                expect(output.truncated).toEqual([]);
                expect(output.stats.expanded).toBe(
                  broadFirst ? 0 : input.rules.length + input.dates.length,
                );
                const wider = expandRuleSet(input, broad);
                expect(wider.intervals).toEqual(intervals);
                expect(wider.gaps).toEqual(gaps);
                expect(wider.complete).toBe(true);
                expect(wider.truncated).toEqual([]);
                const retained = expandRuleSet(input, window);
                expect(retained.intervals).toEqual(intervals);
                expect(retained.gaps).toEqual(gaps);
                expect(retained.complete).toBe(true);
                expect(retained.truncated).toEqual([]);
                expect(retained.stats.expanded).toBe(0);
              });
            }
          }
        }
      }
    }
  }

  for (const [timezone, dtstart, before, start, end] of [
    [
      'America/Chicago',
      '2024-11-03T07:30Z',
      '2024-11-03T07:00Z',
      '2024-11-03T15:00Z',
      '2024-11-03T23:00Z',
    ],
    [
      'America/Havana',
      '2024-11-03T05:30Z',
      '2024-11-03T05:00Z',
      '2024-11-03T14:00Z',
      '2024-11-03T22:00Z',
    ],
  ] as const) {
    for (const until of [before, dtstart]) {
      it(`compares UNTIL ${until} with the second-occurrence DTSTART in ${timezone}`, () => {
        const window = windowFor({ span: 'day', anchorDate: '2024-11-03', timezone });
        const output = expandRuleSet(set([rule({ timezone, dtstart, until })], []), window);
        expect(output.intervals).toEqual(until === dtstart ? [span(start, end, 'rule', 'a')] : []);
        expect(output.gaps).toEqual([]);
        expect(output.complete).toBe(true);
      });
    }
  }

  for (const [timezone, dtstart, until] of [
    ['America/Chicago', '2023-11-05T07:30Z', '2024-11-03T07:00Z'],
    ['America/Havana', '2023-11-05T05:00Z', '2024-11-03T04:30Z'],
  ] as const) {
    it(`preserves the original offset at a later UNTIL repeat in ${timezone}`, () => {
      const window = windowFor({ span: 'day', anchorDate: '2024-11-03', timezone });
      const input = rule({ timezone, dtstart, until });
      expect(enumerate(input, window, 400)).toEqual({ spans: [], capped: false });
      expect(enumerate(input, window, 400, false)).toEqual({ spans: [], capped: false });
    });
  }

  for (const frequency of ['DAILY', 'WEEKLY', 'MONTHLY'] as const) {
    const filters: Record<string, Partial<RosterRule>> = {
      unfiltered: {},
      byweekday: { byweekday: [0, 4] },
      bymonthday: { bymonthday: [1, 4, 11, 18, 25, -1] },
      bysetpos: { bysetpos: [-1] },
      combined: { byweekday: [0, 4], bymonthday: [1, 4, 11, 18, 25, -1], bysetpos: [-1] },
    };
    for (const [name, filter] of Object.entries(filters)) {
      for (const [timezone, dtstart, starts, end] of [
        [
          'America/Chicago',
          '2014-01-31T18:30',
          ['2024-03-01T18:00Z', '2024-03-02T18:00Z', '2024-04-02T18:00Z'],
          '2024-06-01',
        ],
        [
          'America/Chicago',
          '2024-03-03T02:30',
          ['2024-03-16', '2024-03-17', '2024-04-02'],
          '2024-06-01',
        ],
        ['Pacific/Apia', '2011-12-16', ['2012-01-06', '2012-01-07', '2012-02-07'], '2012-06-01'],
        ['America/Chicago', '2024-03-03', ['2024-03-16', '2024-03-17', '2024-04-02'], '2024-06-01'],
        [
          'America/Santiago',
          '2024-09-01',
          ['2024-09-18', '2024-09-19', '2024-10-02'],
          '2024-12-01',
        ],
      ] as const) {
        for (const interval of [undefined, 1]) {
          for (const start of starts) {
            for (const time of [undefined, '00:00', '00:30', '23:59:59.999']) {
              it(`matches original-anchor and retained-envelope ${frequency} with ${name}, ${timezone}, ${dtstart}, interval ${interval}, ${start}, and UNTIL time ${time}`, () => {
                const window = { start: epoch(start), end: epoch(end) };
                const untilDate = new Date(window.end - 10 * 24 * hour).toISOString().slice(0, 10);
                const input = rule({
                  frequency,
                  interval,
                  dtstart,
                  timezone,
                  wkst: 6,
                  ...filter,
                  until: time === undefined ? undefined : `${untilDate}T${time}`,
                });
                const reference = enumerate(input, window, 400, false);
                expect(reference.capped).toBe(false);
                if (time === undefined) expect(reference.spans.length).toBeGreaterThan(0);
                expect(enumerate(input, window, 400)).toEqual(reference);
                clearExpandCache();
                const direct = expandRuleSet(set([input], []), window);
                clearExpandCache();
                const broad = expandRuleSet(set([input], []), {
                  start: epoch(starts[0]) - 14 * 24 * hour,
                  end: window.end,
                });
                expect(broad.complete).toBe(true);
                const retained = expandRuleSet(set([input], []), window);
                expect(retained.stats).toMatchObject({ cacheHits: 1, expanded: 0 });
                expect(direct.complete).toBe(true);
                expect(retained.complete).toBe(true);
                expect(retained.intervals).toEqual(direct.intervals);
                expect(retained.gaps).toEqual(direct.gaps);
                expect(retained.truncated).toEqual(direct.truncated);
              });
            }
          }
        }
      }
    }

    it(`keeps the lifetime COUNT anchor for interval-1 ${frequency} rules`, () => {
      for (const interval of [undefined, 1]) {
        const input = rule({ frequency, interval, dtstart: '2014-01-31', count: 2 });
        const reference = enumerate(input, window, 400, false);
        expect(reference).toEqual({ spans: [], capped: false });
        expect(enumerate(input, window, 400)).toEqual(reference);
      }
    });
  }

  for (const [
    timezone,
    frequency,
    dtstart,
    until,
    start,
    end,
    broadStart,
    broadEnd,
    expectedSpans,
  ] of [
    [
      'Pacific/Apia',
      'WEEKLY',
      '2011-12-16',
      undefined,
      '2012-01-08',
      '2012-01-15',
      '2011-12-16',
      '2012-01-20',
      [['2012-01-12T19:00Z', '2012-01-13T03:00Z']],
    ],
    [
      'America/Chicago',
      'DAILY',
      '2024-03-01T02:30',
      '2024-03-17T02:30',
      '2024-03-16',
      '2024-03-23',
      '2024-03-01',
      '2024-03-23',
      [
        ['2024-03-16T14:00Z', '2024-03-16T22:00Z'],
        ['2024-03-17T14:00Z', '2024-03-17T22:00Z'],
      ],
    ],
    [
      'America/Santiago',
      'DAILY',
      '2024-09-01',
      '2024-09-20T00:30',
      '2024-09-18',
      '2024-09-23',
      '2024-09-01',
      '2024-09-23',
      [
        ['2024-09-18T12:00Z', '2024-09-18T20:00Z'],
        ['2024-09-19T12:00Z', '2024-09-19T20:00Z'],
        ['2024-09-20T12:00Z', '2024-09-20T20:00Z'],
      ],
    ],
  ] as const) {
    it(`keeps ${timezone} intervals independent of containing-envelope call order`, () => {
      const input = set([rule({ id: 'friday', timezone, frequency, dtstart, until })], []);
      const window = { start: epoch(start), end: epoch(end) };
      const expected = expectedSpans.map(([start, end]) => span(start, end, 'rule', 'friday'));
      const original = enumerate(input.rules[0] as RosterRule, envelopeFor(window), 400, false);
      expect(original.capped).toBe(false);
      const reference = original.spans.filter(
        (span) => span.start >= window.start && span.end <= window.end,
      );
      expect(reference).toEqual(expected.map(({ start, end }) => ({ start, end })));
      const direct = expandRuleSet(input, window);
      clearExpandCache();
      expect(
        expandRuleSet(input, { start: epoch(broadStart), end: epoch(broadEnd) }).complete,
      ).toBe(true);
      const retained = expandRuleSet(input, window);
      expect(retained.stats).toMatchObject({ cacheHits: 1, expanded: 0 });
      expect(retained.complete).toBe(true);
      expect(direct.complete).toBe(true);
      expect(retained.intervals).toEqual(expected);
      expect(direct.intervals).toEqual(expected);
    });
  }

  it('preserves filtered DAILY phase across display windows and retained envelopes', () => {
    const input = set(
      [rule({ dtstart: '2023-02-01', interval: 2, byweekday: [0], hourend: 10 })],
      [],
    );
    const expected = [
      span('2024-03-11T09:00Z', '2024-03-11T10:00Z', 'rule', 'a'),
      span('2024-03-25T09:00Z', '2024-03-25T10:00Z', 'rule', 'a'),
    ];
    for (const start of ['2024-03-01', '2024-03-02']) {
      const window = { start: epoch(start), end: epoch('2024-04-01') };
      clearExpandCache();
      const narrow = expandRuleSet(input, window);
      expect(narrow.intervals).toEqual(expected);
      expect(narrow.complete).toBe(true);
      clearExpandCache();
      const broad = expandRuleSet(input, { start: epoch('2023-02-01'), end: window.end });
      expect(broad.intervals.filter((span) => span.start >= window.start)).toEqual(expected);
      const retained = expandRuleSet(input, window);
      expect(retained.intervals).toEqual(expected);
      expect(retained.stats.expanded).toBe(0);
      clearExpandCache();
      const counted = expandRuleSet(
        set(
          input.rules.map((rule) => ({ ...rule, count: 10000 })),
          [],
        ),
        window,
      );
      expect(counted.intervals).toEqual(expected);
      expect(counted.complete).toBe(true);
    }
  });

  it('maps monthly filters, last positions, and inclusive date UNTIL', () => {
    const output = expandRuleSet(
      set(
        [
          rule({
            frequency: 'MONTHLY',
            byweekday: [0, 1, 2, 3, 4],
            bymonth: [3],
            bysetpos: [-1],
            until: '2024-03-29',
          }),
        ],
        [],
      ),
      { start: epoch('2024-03-01'), end: epoch('2024-04-01') },
    );
    expect(output.intervals).toEqual([span('2024-03-29T09:00Z', '2024-03-29T17:00Z', 'rule', 'a')]);
  });

  it('preserves the 31st across February from the original monthly anchor', () => {
    const output = expandRuleSet(set([rule({ dtstart: '2020-01-31', frequency: 'MONTHLY' })], []), {
      start: epoch('2024-04-02'),
      end: epoch('2024-06-01'),
    });
    expect(output.intervals).toEqual([span('2024-05-31T09:00Z', '2024-05-31T17:00Z', 'rule', 'a')]);
  });

  it('maps negative month days and empty filter arrays', () => {
    const input = rule({
      frequency: 'MONTHLY',
      bymonthday: [-1],
      byweekday: [],
      bymonth: [],
      bysetpos: [],
    });
    const output = expandRuleSet(set([input], []), {
      start: epoch('2024-02-01'),
      end: epoch('2024-03-01'),
    });
    expect(output.intervals).toEqual([span('2024-02-29T09:00Z', '2024-02-29T17:00Z', 'rule', 'a')]);
  });

  it('applies wkst and interval without changing lifetime COUNT', () => {
    const output = expandRuleSet(
      set(
        [
          rule({
            frequency: 'WEEKLY',
            dtstart: '2024-03-03',
            byweekday: [0, 6],
            wkst: 6,
            interval: 2,
            count: 3,
          }),
        ],
        [],
      ),
      { start: epoch('2024-03-03'), end: epoch('2024-03-19') },
    );
    expect(output.intervals.map(({ start }) => new Date(start).toISOString())).toEqual([
      '2024-03-03T09:00:00.000Z',
      '2024-03-04T09:00:00.000Z',
      '2024-03-17T09:00:00.000Z',
    ]);
    expect(
      expandRuleSet(set([rule({ dtstart: '2020-01-01', count: 2 })], []), window).intervals,
    ).toEqual([]);
  });

  it('interprets plain datetimes locally and offset datetimes as instants in the rule zone', () => {
    const local = rule({
      dtstart: '2024-03-05T01:00:00',
      until: '2024-03-05T01:00:00',
      timezone: 'America/Chicago',
    });
    const instant = {
      ...local,
      dtstart: '2024-03-05T07:00:00Z',
      until: '2024-03-05T09:00:00+02:00',
    };
    const expected = [span('2024-03-05T15:00Z', '2024-03-05T23:00Z', 'rule', 'a')];
    expect(expandRuleSet(set([local], []), window).intervals).toEqual(expected);
    expect(expandRuleSet(set([instant], []), window).intervals).toEqual(expected);
    expect(
      expandRuleSet(set([rule({ dtstart: '2024-03-06T01:00', until: '2024-03-05' })], []), window)
        .intervals,
    ).toEqual([]);
  });

  it('resolves skipped and repeated hours compatibly, and hour 24 at next local midnight', () => {
    const input = set(
      [],
      [date({ date: '2024-03-10', timezone: 'America/Chicago', hourstart: 2.5, hourend: 4 })],
    );
    expect(
      expandRuleSet(input, { start: epoch('2024-03-10'), end: epoch('2024-03-11') }).intervals,
    ).toEqual([span('2024-03-10T08:30Z', '2024-03-10T09:00Z', 'date', 'd')]);
    const fall = set(
      [],
      [date({ date: '2024-11-03', timezone: 'America/Chicago', hourstart: 1.5, hourend: 24 })],
    );
    expect(
      expandRuleSet(fall, { start: epoch('2024-11-03'), end: epoch('2024-11-05') }).intervals,
    ).toEqual([span('2024-11-03T06:30Z', '2024-11-04T06:00Z', 'date', 'd')]);
    const skipped = set([], [date({ date: '2011-12-30', timezone: 'Pacific/Apia' })]);
    expect(
      expandRuleSet(skipped, { start: epoch('2011-12-28'), end: epoch('2012-01-02') }).intervals,
    ).toEqual([]);
  });

  for (const retained of [false, true]) {
    for (const scenario of [
      {
        name: 'whole date after a straddling skip',
        dates: [date({ date: '1919-03-31', timezone: 'America/Toronto' })],
        intervals: [span('1919-03-31T04:30Z', '1919-04-01T04:00Z', 'date', 'd')],
        gaps: [],
      },
      {
        name: 'whole date before a straddling skip',
        dates: [date({ date: '1919-03-30', timezone: 'America/Toronto' })],
        intervals: [span('1919-03-30T05:00Z', '1919-03-31T04:30Z', 'date', 'd')],
        gaps: [],
      },
      {
        name: 'whole date exclusion of a partial include',
        dates: [
          date({ date: '1919-03-31', timezone: 'America/Toronto', hourstart: 0.5, hourend: 2 }),
          date({ id: 'exclude', kind: 'exclude', date: '1919-03-31', timezone: 'America/Toronto' }),
        ],
        intervals: [],
        gaps: [span('1919-03-31T04:30Z', '1919-03-31T06:00Z', 'date', 'exclude')],
      },
      {
        name: 'explicit midnight retains compatible resolution',
        dates: [
          date({ date: '1919-03-31', timezone: 'America/Toronto', hourstart: 0, hourend: 24 }),
        ],
        intervals: [span('1919-03-31T05:00Z', '1919-04-01T04:00Z', 'date', 'd')],
        gaps: [],
      },
      {
        name: 'wholly skipped date',
        dates: [date({ date: '2011-12-30', timezone: 'Pacific/Apia' })],
        intervals: [],
        gaps: [],
      },
    ]) {
      it(`preserves ${scenario.name}, retained ${retained}`, () => {
        const skipped = scenario.name === 'wholly skipped date';
        const window = {
          start: epoch(skipped ? '2011-12-28' : '1919-03-29'),
          end: epoch(skipped ? '2012-01-02' : '1919-04-02'),
        };
        const input = set([], scenario.dates);
        if (retained) expandRuleSet(input, { start: window.start - hour, end: window.end + hour });
        const output = expandRuleSet(input, window);
        expect(output.intervals).toEqual(scenario.intervals);
        expect(output.gaps).toEqual(scenario.gaps);
        expect(output.complete).toBe(true);
        expect(output.stats.expanded).toBe(retained ? 0 : scenario.dates.length);
      });
    }
  }

  it('ignores partial and whole-day overrides on a wholly skipped local date', () => {
    const window = { start: epoch('2011-12-28'), end: epoch('2012-01-02') };
    const following = date({ id: 'following', date: '2011-12-31', timezone: 'Pacific/Apia' });
    const expected = expandRuleSet(set([], [following]), window).intervals;
    expect(expected).toHaveLength(1);
    for (const hours of [{}, { hourstart: 9, hourend: 17 }]) {
      const skipped = date({ date: '2011-12-30', timezone: 'Pacific/Apia', ...hours });
      const included = expandRuleSet(set([], [skipped]), window);
      expect(included.intervals).toEqual([]);
      expect(included.gaps).toEqual([]);
      expect(included.complete).toBe(true);
      const excluded = expandRuleSet(set([], [following, { ...skipped, kind: 'exclude' }]), window);
      expect(excluded.intervals).toEqual(expected);
      expect(excluded.gaps).toEqual([]);
      expect(excluded.complete).toBe(true);
    }
  });

  it('clips a recurring span whose anchor precedes the reused envelope edge', () => {
    const input = set(
      [rule({ count: 1, dtstart: '2024-03-02T00:00', hourstart: 9, hourend: 17 })],
      [],
    );
    const first = expandRuleSet(input, shift(window, 12));
    const output = expandRuleSet(input, {
      start: first.envelope.start,
      end: first.envelope.start + hour,
    });
    expect(output.intervals).toEqual([span('2024-03-02T12:00Z', '2024-03-02T13:00Z', 'rule', 'a')]);
    expect(output.stats.expanded).toBe(0);
  });
});

describe('validation', () => {
  it('rejects either unpaired date hour with a clear error', () => {
    for (const hours of [{ hourstart: 9 }, { hourend: 17 }]) {
      expect(() => expandRuleSet(set([], [date(hours)]), window)).toThrow(
        'hourstart and hourend must both be present or both absent',
      );
    }
  });

  it('returns a complete empty result without expansion for zero-duration windows', () => {
    const skipped = windowFor({ span: 'day', anchorDate: '2011-12-30', timezone: 'Pacific/Apia' });
    expect(skipped.start).toBe(skipped.end);
    for (const input of [set([], []), set()]) {
      const output = expandRuleSet(input, skipped, {
        caps: { perRuleOccurrences: 0, totalOccurrences: 0 },
      });
      expect(output).toEqual({
        intervals: [],
        gaps: [],
        envelope: envelopeFor(skipped),
        complete: true,
        truncated: [],
        stats: {
          rules: input.rules.length,
          dates: input.dates.length,
          expanded: 0,
          cacheHits: 0,
          cacheMisses: 0,
        },
      });
    }
    expect(expandStats().expanded).toBe(0);
    expect(expandRuleSet(set(), { start: 1, end: 1 }).complete).toBe(true);
  });

  it('rejects invalid temporal fields identically before empty-window expansion', () => {
    for (const input of [
      set([], [date({ date: 'invalid', timezone: 'invalid' })]),
      set([], [date({ date: '2024-02-30' })]),
      set([], [date({ timezone: 'invalid' })]),
      set([rule({ dtstart: 'invalid' })], []),
      set([rule({ dtstart: '2024-02-30' })], []),
      set([rule({ until: 'invalid' })], []),
      set([rule({ until: '2024-02-30' })], []),
      set([rule({ timezone: 'invalid' })], []),
    ]) {
      let failure: unknown;
      try {
        expandRuleSet(input, { start: 0, end: 1 });
      } catch (error) {
        failure = error;
      }
      expect(failure).toBeInstanceOf(RangeError);
      expect(() => expandRuleSet(input, { start: 0, end: 0 })).toThrow(failure as Error);
    }
    expect(expandStats().expanded).toBe(0);
  });

  it('rejects invalid windows and limits', () => {
    for (const bad of [
      { start: 2, end: 1 },
      { start: NaN, end: 5 },
      { start: 0, end: Infinity },
      { start: 0.5, end: 1 },
    ]) {
      expect(() => expandRuleSet(set(), bad)).toThrow('window');
    }
    for (const key of ['maxEntries', 'maxEnvelopes']) {
      for (const value of [-1, 1.5, Infinity])
        expect(() => expandRuleSet(set(), window, { cache: { [key]: value } })).toThrow(
          'nonnegative integer',
        );
    }
    for (const key of ['perRuleOccurrences', 'totalOccurrences']) {
      expect(() => expandRuleSet(set(), window, { caps: { [key]: -1 } })).toThrow(
        'nonnegative integer',
      );
    }
  });

  it('rejects invalid identity, hours, frequency, and recurrence fields', () => {
    for (const bad of [
      { id: '' },
      { kind: 'INCLUDE' },
      { frequency: 'SECONDLY' },
      { hourstart: undefined, hourend: undefined },
      { hourstart: -1 },
      { hourstart: 24 },
      { hourend: 25 },
      { hourstart: NaN },
      { hourend: Infinity },
      { count: 0 },
      { interval: 0.5 },
      { wkst: 7 },
      { byweekday: [-1] },
      { bymonth: [13] },
      { bymonthday: [0] },
      { bysetpos: [367] },
      { bysetpos: [1.5] },
    ]) {
      expect(() => expandRuleSet(set([rule(bad as Partial<RosterRule>)], []), window)).toThrow();
    }
    expect(() => expandRuleSet(set([], [date({ timezone: 'Not/AZone' })]), window)).toThrow();
    expect(() => expandRuleSet(set([], [date({ date: '2024-02-30' })]), window)).toThrow();
    expect(() => expandRuleSet(set([rule({ dtstart: 'bad' })], []), window)).toThrow();
  });
});

// Independent plain-date oracle: walk every date, filter, then select positions.
// It never calls the recurrence engine or the adapter's period helpers.
function positionalOracle(input: RosterRule, window: Window): Interval[] {
  const anchor = Temporal.PlainDate.from(input.dtstart.slice(0, 10));
  let cursor = anchor.with({ day: 1 }).subtract({ weeks: 1 });
  const end = Temporal.Instant.fromEpochMilliseconds(window.end)
    .toZonedDateTimeISO('UTC')
    .toPlainDate()
    .add({ months: 1 })
    .with({ day: 1 })
    .add({ weeks: 1 });
  const weeksFromAnchor = (date: TemporalModule.Temporal.PlainDate) => {
    const distance = anchor.until(date).days + ((anchor.dayOfWeek - 1 - (input.wkst ?? 0) + 7) % 7);
    return Math.floor(distance / 7);
  };
  const groups = new Map<number, TemporalModule.Temporal.PlainDate[]>();
  while (Temporal.PlainDate.compare(cursor, end) < 0) {
    const period =
      input.frequency === 'MONTHLY'
        ? (cursor.year - anchor.year) * 12 + cursor.month - anchor.month
        : input.frequency === 'WEEKLY'
          ? weeksFromAnchor(cursor)
          : anchor.until(cursor).days;
    if (
      period >= 0 &&
      period % (input.interval ?? 1) === 0 &&
      (!input.bymonth?.length || input.bymonth.includes(cursor.month)) &&
      (!input.byweekday?.length || input.byweekday.includes((cursor.dayOfWeek - 1) as Weekday)) &&
      (!input.bymonthday?.length ||
        input.bymonthday.some(
          (day) => cursor.day === (day > 0 ? day : cursor.daysInMonth + day + 1),
        ))
    ) {
      const dates = groups.get(period) ?? [];
      dates.push(cursor);
      groups.set(period, dates);
    }
    cursor = cursor.add({ days: 1 });
  }
  return [...groups.values()]
    .flatMap((dates) =>
      dates.filter((_, index) =>
        input.bysetpos?.some((position) =>
          position > 0 ? index + 1 === position : index - dates.length === position,
        ),
      ),
    )
    .filter((date) => Temporal.PlainDate.compare(date, anchor) >= 0)
    .slice(0, input.count)
    .map((date) => span(`${date}T09:00Z`, `${date}T17:00Z`, 'rule', input.id))
    .filter((interval) => interval.start < window.end && interval.end > window.start)
    .map((interval) => ({
      ...interval,
      start: Math.max(interval.start, window.start),
      end: Math.min(interval.end, window.end),
    }));
}

describe('authored recurrence period phases', () => {
  const cases: {
    name: string;
    input: Partial<RosterRule>;
    end: string;
    dates: string[];
    positions?: (number[] | undefined)[];
  }[] = [
    ...([0, 6] as const).map((wkst) => ({
      name: `weekly Wednesday DTSTART with WKST ${wkst}`,
      input: { frequency: 'WEEKLY' as const, wkst, byweekday: [0] as Weekday[], count: 3 },
      end: '2024-04-15',
      dates: ['2024-03-18', '2024-04-01'],
    })),
    {
      name: 'Sunday DTSTART in the preceding Monday week',
      input: { frequency: 'WEEKLY', dtstart: '2024-03-03', wkst: 0, byweekday: [0] },
      end: '2024-04-01',
      dates: ['2024-03-11', '2024-03-25'],
    },
    {
      name: 'Sunday DTSTART at the Sunday week boundary',
      input: { frequency: 'WEEKLY', dtstart: '2024-03-03', wkst: 6, byweekday: [0] },
      end: '2024-04-01',
      dates: ['2024-03-04', '2024-03-18'],
    },
    {
      name: 'COUNT 2 rejects the Monday before DTSTART',
      input: { frequency: 'WEEKLY', byweekday: [0], count: 2 },
      end: '2024-05-01',
      dates: ['2024-03-18', '2024-04-01'],
    },
    {
      name: 'COUNT 3 admits the third Monday in a wider window',
      input: { frequency: 'WEEKLY', byweekday: [0], count: 3 },
      end: '2024-05-01',
      dates: ['2024-03-18', '2024-04-01', '2024-04-15'],
    },
    {
      name: 'monthly day 1 retains the DTSTART month phase',
      input: { frequency: 'MONTHLY', bymonthday: [1] },
      end: '2024-08-01',
      dates: ['2024-05-01', '2024-07-01'],
    },
    {
      name: 'monthly weekdays retain the DTSTART month phase',
      input: { frequency: 'MONTHLY', byweekday: [0] },
      end: '2024-06-01',
      dates: [
        '2024-03-11',
        '2024-03-18',
        '2024-03-25',
        '2024-05-06',
        '2024-05-13',
        '2024-05-20',
        '2024-05-27',
      ],
      positions: [undefined],
    },
    {
      name: 'monthly first weekday selects within the DTSTART month phase',
      input: { frequency: 'MONTHLY', byweekday: [0] },
      end: '2024-08-01',
      dates: ['2024-05-06', '2024-07-01'],
      positions: [[1]],
    },
    {
      name: 'matching date-only Monday DTSTART is admitted first',
      input: { frequency: 'WEEKLY', dtstart: '2024-03-04', wkst: 0, byweekday: [0], count: 3 },
      end: '2024-04-15',
      dates: ['2024-03-04', '2024-03-18', '2024-04-01'],
    },
    {
      name: 'matching Monday DTSTART is admitted first',
      input: {
        frequency: 'WEEKLY',
        dtstart: '2024-03-04T12:30',
        wkst: 0,
        byweekday: [0],
        count: 3,
      },
      end: '2024-04-15',
      dates: ['2024-03-04', '2024-03-18', '2024-04-01'],
    },
    {
      name: 'matching monthly day 1 DTSTART is admitted first',
      input: { frequency: 'MONTHLY', dtstart: '2024-03-01', bymonthday: [1], count: 3 },
      end: '2024-08-01',
      dates: ['2024-03-01', '2024-05-01', '2024-07-01'],
    },
    {
      name: 'daily interval phase remains unchanged',
      input: { frequency: 'DAILY', count: 3 },
      end: '2024-04-01',
      dates: ['2024-03-06', '2024-03-08', '2024-03-10'],
    },
    {
      name: 'daily Monday five days after DTSTART preserves authored phase',
      input: { frequency: 'DAILY', byweekday: [0], count: 3 },
      end: '2024-05-01',
      dates: ['2024-03-18', '2024-04-01', '2024-04-15'],
    },
  ];
  for (const sample of cases) {
    for (const bysetpos of sample.positions ?? [undefined, [1], [-1]]) {
      it(`${sample.name}, BYSETPOS ${bysetpos ?? 'absent'}, cold and retained`, () => {
        const input = set(
          [rule({ dtstart: '2024-03-06', interval: 2, ...sample.input, bysetpos })],
          [],
        );
        const window = { start: epoch('2024-03-01T00:00Z'), end: epoch(`${sample.end}T00:00Z`) };
        const expected = sample.dates.map((date) =>
          span(`${date}T09:00Z`, `${date}T17:00Z`, 'rule', 'a'),
        );
        const cold = expandRuleSet(input, window);
        expect(cold.intervals).toEqual(expected);
        expect(cold.complete).toBe(true);
        expect(cold.truncated).toEqual([]);
        clearExpandCache();
        const containing = expandRuleSet(input, {
          start: window.start - 7 * 24 * hour,
          end: window.end + 7 * 24 * hour,
        });
        const retained = expandRuleSet(input, window);
        expect(retained.envelope).toEqual(containing.envelope);
        expect(retained.intervals).toEqual(cold.intervals);
        expect(retained.complete).toBe(true);
        expect(retained.truncated).toEqual([]);
        expect(retained.stats.expanded).toBe(0);
        expect(retained.stats.cacheHits).toBe(1);
      });
    }
  }
});

describe('DAILY weekday filters preserve the authored sequence', () => {
  const cases: { name: string; input: Partial<RosterRule>; dates: string[] }[] = [
    { name: 'interval 2 admits January 15 and 29', input: {}, dates: ['2024-01-15', '2024-01-29'] },
    { name: 'COUNT 1 admits January 15', input: { count: 1 }, dates: ['2024-01-15'] },
    {
      name: 'COUNT 2 admits January 15 and 29',
      input: { count: 2 },
      dates: ['2024-01-15', '2024-01-29'],
    },
    { name: 'UNTIL January 14 admits nothing', input: { until: '2024-01-14' }, dates: [] },
    {
      name: 'UNTIL January 15 admits January 15',
      input: { until: '2024-01-15' },
      dates: ['2024-01-15'],
    },
    {
      name: 'Monday and Thursday admit January 11, 15, 25, and 29',
      input: { byweekday: [0, 3] },
      dates: ['2024-01-11', '2024-01-15', '2024-01-25', '2024-01-29'],
    },
    {
      name: 'interval 3 Mondays admit January 15 only',
      input: { interval: 3 },
      dates: ['2024-01-15'],
    },
    {
      name: 'matching Monday DTSTART admits January 1, 15, and 29',
      input: { dtstart: '2024-01-01' },
      dates: ['2024-01-01', '2024-01-15', '2024-01-29'],
    },
    {
      name: 'advanced interval 1 anchor admits January 1, 8, 15, 22, and 29',
      input: { dtstart: '2023-01-04', interval: 1 },
      dates: ['2024-01-01', '2024-01-08', '2024-01-15', '2024-01-22', '2024-01-29'],
    },
    {
      name: 'weekday filtering precedes an empty daily positional selection',
      input: { bysetpos: [2] },
      dates: [],
    },
  ];
  for (const sample of cases) {
    for (const bysetpos of sample.input.bysetpos
      ? [sample.input.bysetpos]
      : [undefined, [1], [-1]]) {
      it(`${sample.name}, BYSETPOS ${sample.input.bysetpos ?? bysetpos ?? 'absent'}, cold and retained`, () => {
        const input = set(
          [
            rule({
              dtstart: '2024-01-03',
              interval: 2,
              byweekday: [0],
              hourend: 10,
              bysetpos,
              ...sample.input,
            }),
          ],
          [],
        );
        const window = { start: epoch('2024-01-01'), end: epoch('2024-02-01') };
        const expected = sample.dates.map((date) =>
          span(`${date}T09:00Z`, `${date}T10:00Z`, 'rule', 'a'),
        );
        const cold = expandRuleSet(input, window);
        expect(cold.intervals).toEqual(expected);
        expect(cold.complete).toBe(true);
        expect(cold.truncated).toEqual([]);
        const original = enumerate(input.rules[0] as RosterRule, envelopeFor(window), 400, false);
        expect(original.capped).toBe(false);
        expect(
          original.spans.filter((span) => span.start >= window.start && span.end <= window.end),
        ).toEqual(expected.map(({ start, end }) => ({ start, end })));
        clearExpandCache();
        const broad = expandRuleSet(input, {
          start: epoch('2023-12-01'),
          end: epoch('2024-03-01'),
        });
        expect(broad.complete).toBe(true);
        const retained = expandRuleSet(input, window);
        expect(retained.envelope).toEqual(broad.envelope);
        expect(retained.intervals).toEqual(expected);
        expect(retained.complete).toBe(true);
        expect(retained.truncated).toEqual([]);
        expect(retained.stats).toMatchObject({ expanded: 0, cacheHits: 1 });
      });
    }
  }

  for (const bysetpos of [undefined, [1], [-1]]) {
    it(`caps the authored sequence at January 15, BYSETPOS ${bysetpos ?? 'absent'}`, () => {
      const output = expandRuleSet(
        set(
          [rule({ dtstart: '2024-01-03', interval: 2, byweekday: [0], hourend: 10, bysetpos })],
          [],
        ),
        { start: epoch('2024-01-01'), end: epoch('2024-02-01') },
        { caps: { perRuleOccurrences: 1 } },
      );
      expect(output.intervals).toEqual([
        span('2024-01-15T09:00Z', '2024-01-15T10:00Z', 'rule', 'a'),
      ]);
      expect(output.complete).toBe(false);
      expect(output.truncated).toEqual([{ id: 'a', droppedAtLeast: 1 }]);
    });
  }
});

describe('adapter positional selection and bounded periods', () => {
  it('applies weekly BYMONTH before BYSETPOS directly and through a containing envelope', () => {
    const input = set(
      [
        rule({
          id: 'r',
          frequency: 'WEEKLY',
          dtstart: '2023-03-06',
          byweekday: [0, 4],
          bymonth: [3],
          bysetpos: [1],
        }),
      ],
      [],
    );
    const window = { start: epoch('2024-03-01T00:00Z'), end: epoch('2024-03-04T00:00Z') };
    const expected = [span('2024-03-01T09:00Z', '2024-03-01T17:00Z', 'rule', 'r')];
    expect(positionalOracle(input.rules[0] as RosterRule, window)).toEqual(expected);
    expect(expandRuleSet(input, window).intervals).toEqual(expected);
    clearExpandCache();
    expandRuleSet(input, { start: epoch('2024-02-01T00:00Z'), end: epoch('2024-04-01T00:00Z') });
    const retained = expandRuleSet(input, window);
    expect(retained.intervals).toEqual(expected);
    expect(retained.complete).toBe(true);
    expect(retained.stats.expanded).toBe(0);
  });

  const emptyRules: Partial<RosterRule>[] = [
    { frequency: 'WEEKLY', byweekday: [4], bysetpos: [2] },
    { frequency: 'MONTHLY', bymonthday: [1], bysetpos: [2] },
    { frequency: 'MONTHLY', bymonthday: [31], bymonth: [2] },
    { frequency: 'MONTHLY', bymonthday: [30, 31], bymonth: [2], byweekday: [0] },
    { frequency: 'MONTHLY', interval: 12, bymonth: [2], byweekday: [4] },
    { frequency: 'DAILY', bymonthday: [31], bymonth: [2] },
    { frequency: 'DAILY', interval: 2, byweekday: [0], bysetpos: [2] },
    { frequency: 'WEEKLY', bymonthday: [31], bymonth: [2] },
  ];
  for (const [index, sample] of emptyRules.entries()) {
    it(`completes empty candidate set ${index} within 500 ms in a bounded subprocess`, () => {
      const input = set([rule({ dtstart: '2024-03-01', ...sample })], []);
      const started = performance.now();
      const child = Bun.spawnSync(
        [
          process.execPath,
          '-e',
          `
        const { expandRuleSet } = require('./src/adapters/rrule');
        const input = ${JSON.stringify(input)};
        const window = ${JSON.stringify(window)};
        const fresh = expandRuleSet(input, window);
        const retained = expandRuleSet(input, window);
        console.log(JSON.stringify({ fresh, retained }));
      `,
        ],
        { cwd: process.cwd(), timeout: 750 },
      );
      expect(child.exitCode).toBe(0);
      expect(performance.now() - started).toBeLessThan(500);
      const { fresh, retained } = JSON.parse(child.stdout.toString());
      for (const output of [fresh, retained, expandRuleSet(input, window)]) {
        expect(output.intervals).toEqual([]);
        expect(output.gaps).toEqual([]);
        expect(output.complete).toBe(true);
        expect(output.truncated).toEqual([]);
      }
      expect(fresh.stats.expanded).toBe(1);
      expect(retained.stats.expanded).toBe(0);
    });
  }

  for (const frequency of ['WEEKLY', 'MONTHLY'] as const) {
    for (const wkst of [0, 2, 6] as const) {
      for (const bysetpos of [[1], [-1], [2, -1, 2]]) {
        for (const interval of [1, 2]) {
          it(`matches plain-date positions for ${frequency}, WKST ${wkst}, positions ${bysetpos}, interval ${interval}`, () => {
            const input = rule({
              frequency,
              wkst,
              bysetpos,
              interval,
              dtstart: '2023-03-06',
              byweekday: [0, 4],
              bymonth: [3],
            });
            const windows = [
              { start: epoch('2024-03-01T00:00Z'), end: epoch('2024-03-04T00:00Z') },
              { start: epoch('2024-03-13T00:00Z'), end: epoch('2024-03-30T00:00Z') },
              { start: epoch('2023-03-06T00:00Z'), end: epoch('2023-04-01T00:00Z') },
            ];
            for (const window of windows) {
              clearExpandCache();
              const expected = positionalOracle(input, window);
              expect(expandRuleSet(set([input], []), window).intervals).toEqual(expected);
              for (const advance of [true, false]) {
                expect(enumerate(input, window, 400, advance)).toEqual({
                  spans: expected.map(({ start, end }) => ({ start, end })),
                  capped: false,
                });
              }
              clearExpandCache();
              expandRuleSet(set([input], []), {
                start: window.start - 40 * 24 * hour,
                end: window.end + 40 * 24 * hour,
              });
              const retained = expandRuleSet(set([input], []), window);
              expect(retained.intervals).toEqual(expected);
              expect(retained.stats.expanded).toBe(0);
            }
          });
        }
      }
    }
    it(`selects exact last ${frequency} dates and counts only selected positions`, () => {
      const input = rule({ frequency, dtstart: '2024-03-01', byweekday: [0, 4], bysetpos: [-1] });
      const window = { start: epoch('2024-03-01T00:00Z'), end: epoch('2024-05-01T00:00Z') };
      const dates =
        frequency === 'WEEKLY' ? ['2024-03-01', '2024-03-08'] : ['2024-03-29', '2024-04-29'];
      const expected = dates.map((date) => span(`${date}T09:00Z`, `${date}T17:00Z`, 'rule', 'a'));
      const counted = { ...input, count: 2 };
      expect(positionalOracle(counted, window)).toEqual(expected);
      expect(expandRuleSet(set([counted], []), window).intervals).toEqual(expected);
      clearExpandCache();
      const capped = expandRuleSet(set([input], []), window, { caps: { perRuleOccurrences: 1 } });
      expect(capped.intervals).toEqual(expected.slice(0, 1));
      expect(capped.complete).toBe(false);
      expect(capped.truncated).toEqual([{ id: 'a', droppedAtLeast: 1 }]);
      clearExpandCache();
      const exact = expandRuleSet(set([counted], []), window, { caps: { perRuleOccurrences: 2 } });
      expect(exact.intervals).toEqual(expected);
      expect(exact.complete).toBe(true);
    });
  }

  it('selects daily positions, preserves implicit weekdays, and rejects positions before DTSTART', () => {
    expect(enumerate(rule({ bysetpos: [2] }), window, 400)).toEqual({ spans: [], capped: false });
    const input = rule({ frequency: 'WEEKLY', dtstart: '2024-03-06', bysetpos: [-1] });
    expect(expandRuleSet(set([input], []), window).intervals).toEqual([
      span('2024-03-06T09:00Z', '2024-03-06T17:00Z', 'rule', 'a'),
    ]);
    const before = rule({
      frequency: 'MONTHLY',
      dtstart: '2024-03-15',
      bymonthday: [1, 20],
      bysetpos: [1],
    });
    expect(
      enumerate(before, { start: epoch('2024-03-01'), end: epoch('2024-04-01') }, 400).spans,
    ).toEqual([]);
  });

  it('does not count replay as a second daily positional candidate', () => {
    const input = rule({ dtstart: '2024-03-04', byweekday: [4], bysetpos: [2] });
    const window = { start: epoch('2024-03-04'), end: epoch('2024-03-09') };
    expect(enumerate(input, window, 400)).toEqual({ spans: [], capped: false });
    expect(enumerate({ ...input, bysetpos: [-1] }, window, 400)).toEqual({
      spans: [{ start: epoch('2024-03-08T09:00Z'), end: epoch('2024-03-08T17:00Z') }],
      capped: false,
    });
  });

  it('does not reinterpret an engine failure as complete enumeration', () => {
    const failure = new Error('engine failure');
    const all = spyOn(RRuleTemporal.prototype, 'all').mockImplementation(() => {
      throw failure;
    });
    try {
      expect(() => enumerate(rule(), window, 400)).toThrow(failure);
    } finally {
      all.mockRestore();
    }
  });
});

describe('input string bounds', () => {
  it('rejects oversized date strings before any parsing', () => {
    const window = { start: Date.UTC(2024, 0, 1), end: Date.UTC(2024, 0, 8) };
    const hostile = `Z${'[Z'.repeat(50_000)}`;
    const started = performance.now();
    expect(() =>
      expandRuleSet(
        {
          rules: [
            {
              id: 'hostile',
              kind: 'include',
              frequency: 'DAILY',
              dtstart: hostile,
              hourstart: 9,
              hourend: 17,
              timezone: 'UTC',
            },
          ],
          dates: [],
        },
        window,
      ),
    ).toThrow(/dtstart must be a string of at most 64 characters/);
    expect(() =>
      expandRuleSet(
        { rules: [], dates: [{ id: 'd', kind: 'include', date: hostile, timezone: 'UTC' }] },
        window,
      ),
    ).toThrow(/date must be a string/);
    expect(performance.now() - started).toBeLessThan(50);
  });
});
