# react-native-roster

[![CI](https://github.com/simiancraft/react-native-roster/actions/workflows/ci.yml/badge.svg)](https://github.com/simiancraft/react-native-roster/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/simiancraft/react-native-roster)](https://codecov.io/github/simiancraft/react-native-roster)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/simiancraft/react-native-roster/badge)](https://securityscorecards.dev/viewer/?uri=github.com/simiancraft/react-native-roster)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A React Native read surface for layered intervals with provenance: a stack of lanes,
one per person or resource, against a shared time axis. Scan a column to see who is
on; scan a row to see whether someone set anything at all.

**API not yet shipped.** The pure TypeScript core is implemented in this working tree:
contract types, interval and gap geometry, coverage, caches, and time-axis helpers.
The recurrence adapter is implemented. `Roster` and `Schedule` remain planned APIs. The Expo
Router gallery is still a shell; there is no rendering API yet.

## Design

All expensive work happens outside the render path. Rendering consumes precomputed
geometry. The core accepts absolute intervals and gaps with provenance; recurrence
expansion belongs to an adapter. The planned `Roster` projects many lanes horizontally;
`Schedule` projects one lane into day columns. Both use the same layers and sources.

| Term | Meaning |
| --- | --- |
| roster | The whole read surface: a shared time axis, lanes, and layers. |
| lane | One person or resource row containing layers, a label, and optional metadata. |
| layer | A named, ordered set of intervals and gaps with a role, z-order, and style. |
| interval | Covered absolute time, `[start, end)` in epoch milliseconds, with sources. |
| gap | Removed absolute time with sources; survives complete subtraction. |
| source | Provenance identified by `(kind, id)`; its label is display metadata. |
| window | A bare absolute `{ start, end }` span; resolution belongs to the axis. |
| projection | Geometry mapping: horizontal for a roster, columns for a schedule. |
| adapter | A function outside the core that converts upstream data into lanes and layers. |
| schedule | One lane projected into days across and wall-clock hours down. |

## Entry points

| Import | Contents | Status |
| --- | --- | --- |
| `react-native-roster` | Core re-exports; React surfaces are planned | Core implemented |
| `react-native-roster/core` | Types, layout, coverage, axis helpers, and counters | Implemented |
| `react-native-roster/rrule` | Recurrence expansion, caps, provenance, and caches | Implemented |

The core uses only the standard library and `Intl`. Only the adapter imports
`rrule-temporal` 1.5.2 and `@js-temporal/polyfill` 0.5.1, pinned runtime dependencies.
React, React Native, Expo, and `@legendapp/list` are peers.

## Pure core

```ts
import { dayColumnsFor, layoutLane, windowFor } from 'react-native-roster/core';
import type { Lane, Projection } from 'react-native-roster/core';

const window = windowFor({
  span: 'week',
  anchorDate: '2024-03-10',
  timezone: 'America/Chicago',
});
const lane: Lane = { id: 'one', label: 'One', layers: [] };
const projection: Projection = {
  orientation: 'columns',
  viewTimezone: 'America/Chicago',
  pxPerHour: 60,
  columnWidth: 100,
  days: dayColumnsFor(window, 'America/Chicago'),
};
const geometry = layoutLane(lane, window, projection);
```

`layoutLane` computes rects for visible lanes. `coverageFor(lane, window)` computes
projection-independent union coverage for every lane. `flagFor` reads explicit
flags first and can infer `empty-in-window`; it never infers `never-set`.
Gaps carry provenance even after complete subtraction and are not subtracted again
from coverage. Rect bounds include the layer inset and preserve exact milliseconds.
Column `x` coordinates are local to the column; use `rect.column` to select it.

`windowFor`, `prev`, `next`, and `today` accept a `WindowSpec`. Week bounds default
to Monday. Local-day, week, and month bounds follow the view zone; custom windows
remain absolute. Month navigation clamps an anchor to the target month's last day
when necessary. `dayColumnsFor` returns whole local-day bounds intersecting the
window. A skipped local date has no column; compare `localDate` values for a header
gap. Date labels currently use English abbreviated weekdays.

Columns have 24 equal hour bands. Skipped time is empty; repeated time uses two
half-height sub-regions. `timeAtY(projection, columnIndex, y)` resolves the absolute
occurrence or returns `null` in skipped time or outside a column. The horizontal
projection has no origin field, so `timeAtX(projection, window, x)` takes the window
and returns an epoch time at true elapsed length. `snapToStep` floors a
pointer result to a positive divisor of 60 in the view zone and clamps at a crossed
transition. Minute steps never change geometry or cache keys.

Layout keys include lane id, version, window bounds, and every projection field.
Without `lane.version`, a canonical structural encoding of `layers` supplies the
content key. Bump a supplied version when layers change. Lane label, timezone,
flag, completeness, and metadata never invalidate rects. Flag and coverage are
read on every assembly; complete inputs retain their object references, including
when revisiting a projection. Treat returned objects as read-only. Clear caches
explicitly when their retained windows are no longer useful.

`layoutStats` and `coverageStats` return cumulative `{ runs, cacheHits }` snapshots.
`resetStats` resets counters without clearing keys; `clearLayoutCache` and
`clearCoverageCache` clear keys without resetting counters. Target-warm means the
exact requested keys exist; target-cold means they are absent.

The deterministic fixture in `test/fixtures/workload.ts` produces **70 rects plus
gap rects per lane per week** (63 rects and 7 gap rects) in either projection.
Workload W uses 200 lanes, two layers, and a 24-lane viewport at 15-minute ticks.
Tests enforce separate 16 ms target-cold layout and coverage budgets and print the
measured baselines. Device performance remains an issue #9 acceptance item.

## Recurrence adapter

```ts
import { expandRuleSet } from 'react-native-roster/rrule';
import type { RuleSet } from 'react-native-roster/rrule';

const set: RuleSet = {
  rules: [{
    id: 'weekday-hours', kind: 'include', frequency: 'WEEKLY',
    dtstart: '2024-01-01', byweekday: [0, 1, 2, 3, 4],
    hourstart: 9, hourend: 17, timezone: 'America/Chicago',
  }],
  dates: [],
};
const result = expandRuleSet(set, window);
// Put result.intervals and result.gaps on a layer, and result.complete on its lane.
```

`RosterRule` supports DAILY, WEEKLY, and MONTHLY frequencies, count, until,
interval, wkst, byweekday, bymonth, bymonthday, and bysetpos. Weekdays use the core's
0 = Monday numbering. IDs supply provenance; content determines cache identity.
`RosterDate` adds an included or excluded local date, optional paired hours, and
an optional note displayed as its source label. No hours means the whole day.
Hours satisfy `0 <= hourstart < hourend <= 24`; fractional hours retain millisecond
precision. Hour 24 is next local midnight. Local dates and plain datetimes are
interpreted in the rule's zone; offset datetimes represent instants converted to
that zone. Date-only until includes the whole local date. Temporal's compatible
policy chooses the earlier repeated hour and advances a nonexistent hour.

`expandRuleSet` uses one absolute envelope padded 48 hours on each side, includes
spans crossing its bounds, subtracts exclusions, and clips to the display window.
Interval sources contain only includes; gap sources contain only exclusions that
removed covered time. A completely removed day remains a gap. No view zone enters
the adapter. A contained window reuses the retained envelope, including after a
view-zone shift. `envelopeFor(window)` exposes the padding calculation.

Options default to `cache.maxEntries: 2000`, `cache.maxEnvelopes: 4`,
`caps.perRuleOccurrences: 400`, and `caps.totalOccurrences: 10000`. All accept
nonnegative integers; zero disables retention or admits no occurrences. Per-rule
entries retain only occurrence lists and their cap status. Retained envelopes
are an LRU per set content key. Clear caches when discarding sets; the number of
set histories is not bounded globally. Evicted occurrence entries must expand
again even when their envelope is still retained.

Total caps and netting run fresh on every call. Admission follows rules in id
order, then dates in id order. The first list that does not fit and every later
list are dropped whole. `truncated` reports exact counts for fully enumerated
dropped lists and a lower bound of 1 for lists stopped by the per-rule cap.
Any truncation sets `complete: false`; propagate it to the lane. Caps count the
selected envelope's occurrences, including those outside the display window.

`stats` describes the call; `expandStats()` returns cumulative counters.
`resetExpandStats()` clears counters only, and `clearExpandCache()` clears both
caches only. Changing the total cap reuses occurrence lists; changing the per-rule
cap invalidates them. Returned intervals, sources, and envelope objects are fresh.

## Gallery and platforms

The demo targets iOS, Android, and web using Expo SDK 54, Expo Router 6, React 19.1,
React Native 0.81, React Native Web 0.21, and NativeWind 4.1. It currently displays
`roster` and a build identity line. Fixture routes arrive under `demo/app/gallery/`.

The [Pages workflow](https://github.com/simiancraft/react-native-roster/actions/workflows/deploy-demo.yml)
builds every pull request and deploys `main` to
<https://simiancraft.github.io/react-native-roster/>. Deployment and device rendering
have not yet been verified. Core workload timings run in the test gate. Device measurements, size gates, and
browser interaction tests arrive in issue #9.

## Develop

Use Bun 1.4.0 and Node 22 for the demo and release tooling.

```sh
bun install
bun run check
bun run demo:web
```

`bun run check` covers lint, three typechecks, React Compiler safety, library build,
demo web export, coverage, dead code, and package hygiene. See
[CONTRIBUTING.md](https://github.com/simiancraft/react-native-roster/blob/main/CONTRIBUTING.md)
for the contributor workflow.

## Scope

This is a read surface. Creation, dragging, resizing, and a general-purpose
calendar are outside its scope; consumers attach their own press handlers.
The package replaces react-big-scheduler for this use case; it is not a fork.

## Project

- [Plan and issue order](https://github.com/simiancraft/react-native-roster/issues/1)
- [Authoritative type contract](https://github.com/simiancraft/react-native-roster/issues/3)
- [Conventions](https://github.com/simiancraft/react-native-roster/blob/main/AGENTS.md)
- [Security policy](https://github.com/simiancraft/react-native-roster/blob/main/SECURITY.md)
- [Code of conduct](https://github.com/simiancraft/react-native-roster/blob/main/CODE_OF_CONDUCT.md)
- [Notices](https://github.com/simiancraft/react-native-roster/blob/main/NOTICE.md)

MIT, copyright 2026 Jesse Harlin (the-simian). See [LICENSE](./LICENSE).
