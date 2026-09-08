# Write an adapter

An adapter turns your upstream data into `Lane[]`. It lives in the consumer or a
separate package; there is no registration API, base class, or core plugin hook.
The renderer accepts absolute intervals with provenance, so a table of shifts,
a calendar feed, and recurring local hours all meet the same boundary.

Start with the [static quick start](../README.md#quick-start-static-intervals).
Only use `react-native-roster/rrule` when your input actually contains recurring
rules. The core and root entry points never import recurrence dependencies.

## 1. Choose the identity and ownership

One resource becomes one lane with a stable `id`; one independently styled or
ordered set becomes one layer. Use unique layer ids within each lane. A source
is `{ kind, id, label? }`, identified by the pair `(kind, id)`. Labels are display
metadata. Keep ids stable across fetches, window changes, and object reconstruction.

A layer's `role` is `availability`, `booking`, or `custom`. Coverage uses role,
not z-order or the name of a layer. Higher `z` draws over lower `z`; later layers
win equal-z press ties. `inset` is a cross-axis pixel distance applied by the core.

## 2. Convert a table to a lane

This complete adapter accepts already absolute ISO timestamps with explicit
UTC offsets. Upstream rows are fetched before rendering. Validation belongs at
this boundary; invalid input must not quietly become an empty lane.

```ts
import type { Lane, Layer, LayerRole } from 'react-native-roster/core';

type Row = {
  id: string;
  start: string;
  end: string;
  role: LayerRole;
};
type Resource = {
  id: string;
  label: string;
  timezone?: string;
  configured: boolean;
  complete: boolean;
  rows: Row[];
};

export function laneFromRows(resource: Resource): Lane {
  const roles: LayerRole[] = ['availability', 'booking', 'custom'];
  const colors = ['#4f9478', '#334e8a', '#7c3aed'];
  const layers: Layer[] = roles.map((role, z) => ({
    id: role, role, z,
    style: { color: colors[z]!, inset: role === 'booking' ? 4 : 0 },
    intervals: resource.rows.filter((row) => row.role === role).map((row) => {
      const start = Date.parse(row.start);
      const end = Date.parse(row.end);
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= end) {
        throw new RangeError(`Invalid absolute bounds for row ${row.id}`);
      }
      return { start, end, sources: [{ kind: 'table', id: row.id }] };
    }),
  }));
  return {
    id: resource.id, label: resource.label, timezone: resource.timezone,
    flag: resource.configured ? undefined : 'never-set',
    complete: resource.complete, layers,
  };
}
```

Feed the result to either `Roster` or `Schedule`. No `version` is needed for
correctness; the core derives a structural key from layers. If you supply a
version to avoid that work, bump it on every layer-content change, including a
new clipped window's output. A database revision alone is insufficient when
adapter output also depends on the requested window.

For a calendar feed, resolve floating local times and recurrence in the feed's
zone before creating epoch bounds. Do not parse a zone-less local datetime with
`Date.parse`: that makes the result depend on the host's timezone. Preserve the
feed's source identity across occurrences. The renderer does not parse ICS text.

## 3. Preserve covered and removed time

Return `[start, end)` in integer epoch milliseconds. Never snap to `minuteStep`.
An interval shorter than a minute is still an interval. Clip to the requested
window, retaining the exact source set for each resulting span.

When upstream data includes exclusions, subtract them in the adapter. The core
accepts already netted intervals and does not subtract `gaps` from them. Emit a
gap for removed covered time, even when an exclusion removes the entire include.
Interval sources describe includes only; gap sources describe excludes only.
If A covers 09:00 to 11:00 and B covers 10:00 to 12:00, the exact provenance is
`{A}`, `{A, B}`, and `{B}` on three spans. Overlap within a layer may be passed to
the core's provenance sweep, but an adapter must not attach neighboring sources
to spans they do not cover.

`flag: 'never-set'` requires upstream knowledge of missing configuration.
`empty-in-window` is inferred only when a lane has intervals overall and none
intersect the window. A window-clipped empty result alone proves neither state.
Propagate known truncation or incomplete fetching as `Lane.complete: false`.
Consumers should never describe that result as definitive empty time.

## 4. Map recurring rows to the shipped adapter

The [recurrence quick start](../README.md#quick-start-recurring-local-hours) is a
complete mapping into a lane. `expandRuleSet(set, window, options?)` accepts:

| Input | Required fields | Optional fields |
| --- | --- | --- |
| `RosterRule` | `id`, `kind`, `frequency`, `dtstart`, `hourstart`, `hourend`, `timezone` | `until`, `count`, `interval`, `wkst`, `byweekday`, `bymonth`, `bymonthday`, `bysetpos` |
| `RosterDate` | `id`, `kind`, `date`, `timezone` | `note`, and both `hourstart` and `hourend` together |
| `RuleSet` | `rules: RosterRule[]`, `dates: RosterDate[]` | None |

Kinds are `include` or `exclude`; frequencies are `DAILY`, `WEEKLY`, or `MONTHLY`.
Weekdays are Monday = 0 through Sunday = 6. Rule `dtstart` is an ISO date or
datetime; `date` is a local ISO date. Hours obey
`0 <= hourstart < hourend <= 24`; fractional hours are supported. A dated override
without either hour covers its whole local day. One hour alone is invalid.

Convert enums to those exact values, `Date` values to appropriate ISO strings,
and database `null` to omitted optional fields. Drop unsupported recurrence
fields: `byyearday`, `byweekno`, `byhour`, `byminute`, and `bysecond`. Do not imply
that dropping a semantically active field preserves an arbitrary upstream rule;
reject unsupported semantics or handle them in your own adapter. Source kinds
emitted here are `rule` and `date`; a dated `note` becomes source label metadata.

The rule/date zone interprets local hours. Lane timezone is a display cue.
The view timezone is not an expansion argument or cache-key field. Derive the
absolute window with `windowFor(windowSpec)`, then pass only that window.

## 5. Keep occurrence caching separate from assembly

If writing a recurring or window-fetching adapter, follow this memoization
contract. The shipped adapter is the reference implementation, not a cache of
finished lanes or netted output.

1. **One absolute envelope for the whole set.** `envelopeFor(window)` pads start
   and end by exactly 48 absolute hours. Evaluate every include, exclude, and
   dated override over that same envelope. Fetching exclusions over a narrower
   span can leave covered time that should have been removed.
2. **Retain envelope history by set content.** The shipped adapter canonically
   orders rules by id, then dates by id, and keys a history by the set's content.
   Inspect retained envelopes for containment of the new display window; exact
   window equality is not required. Reuse the most recently used containing
   envelope; otherwise create and retain a new one. Default retention is four
   envelopes per set, so next then previous can reuse both.
3. **Content-keyed per-item entries.** Cache each item's occurrence list and its
   per-item cap status by body content, exact envelope start/end, and per-rule
   cap. Identity and display metadata are attached during assembly. In the
   shipped adapter, the per-item body key excludes id
   and dated note, allowing identical occurrence bodies to share work. Editing
   a set creates a new set history; unchanged item bodies still hit when the
   selected envelope bounds match an existing key.
4. **Containment only chooses bounds.** An envelope hit is not an occurrence hit.
   The corresponding per-item entries may have been evicted. `expanded === 0`
   requires every exact requested occurrence key to be retained. Default
   occurrence retention is a shared LRU of 2000 entries.
5. **Assemble fresh on every call.** Fetch occurrences, apply the total cap,
   attach current provenance, net includes minus excludes, and clip to the
   display window. Do not cache assembly by the envelope. Changing a total cap
   must affect the next result without re-expanding occurrences.
6. **Own lifetime and counters.** `clearExpandCache()` empties both occurrence
   entries and envelope histories without resetting counters. `resetExpandStats()`
   resets counters without emptying keys. Histories are bounded per set, not
   globally across all distinct edited sets; clear when discarding old sets.

The 48-hour padding covers ordinary view-zone reanchoring of the same local week.
It does not make arbitrary navigation free. Check actual containment and retained
keys, especially after edits, cap changes, or unusual historical date skips.
`cache.maxEntries` and `cache.maxEnvelopes` accept nonnegative integers; zero
turns off their corresponding retention. They are retention budgets, not output caps.

## 6. Carry completeness through caps

Defaults are `caps.perRuleOccurrences: 400` and `caps.totalOccurrences: 10000`.
Caps count occurrences across the chosen envelope, including those outside the
visible window. The result is:

```ts
// ExpandResult
{
  intervals, gaps, envelope, complete,
  truncated: [{ id, droppedAtLeast }],
  stats: { rules, dates, expanded, cacheHits, cacheMisses },
}
```

A per-rule cap stops enumeration and records `droppedAtLeast: 1`, because the
remaining count is unknown. The retained prefix may still contribute intervals.
The total cap admits whole occurrence lists in rule-id order, then date-id order.
The first list that does not fit and every later list are dropped whole; fully
enumerated dropped lists report their exact count. Equality with the remaining
budget fits. Any truncation makes `complete` false.

Changing `totalOccurrences` only reruns assembly; changing `perRuleOccurrences`
changes every requested per-item key. A cap may drop an exclusion as well as an
include, so incomplete output is not necessarily a conservative subset of the
true covered time. Carry `complete` into the lane and display `truncated` where
the consumer can inspect missing data. The
[editable cap route](../demo/app/gallery/adapter-caps.tsx) demonstrates this.

## 7. Verify your adapter and add a fixture

Test exact epoch boundaries, source identity, partial and complete subtraction,
midnight crossings, and invalid input. For recurring data, test DST, next/previous
envelope reuse, single-body edits, both caps, and occurrence eviction inside a
retained envelope. Assert counters after resetting them without clearing keys for
a target-warm action; clear keys explicitly for a target-cold measurement.

In this repository, put named fixtures in `test/fixtures`, add a thin route shell
under `demo/app/gallery`, and register it in the appropriate fixture record. The
home page derives links from those records. Roster fixtures with `ruleSet` get an
editor through `ruleSetEditorZone`; `useRuleSetDraft` owns JSON text, parsing, and
the last applied set. Options belong to the fixture, and invalid edits keep the
last valid roster. Controls and snapshots belong to the route hook.

Run `bun run check` after installing dependencies and Chromium as documented in
the README. Browser evidence complements physical iOS and Android checks;
[performance evidence](./performance.md) describes the separate release gate.
