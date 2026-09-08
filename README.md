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
`Roster`, `useRoster`, replaceable zones, the provenance and timezone gallery routes,
and the recurrence adapter are implemented. `Schedule` remains a planned API.

## Design

All expensive work happens outside the render path. Rendering consumes precomputed
geometry. The core accepts absolute intervals and gaps with provenance; recurrence
expansion belongs to an adapter. `Roster` projects many lanes horizontally;
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
| `react-native-roster` | Roster, useRoster, default zones, and core re-exports | Implemented |
| `react-native-roster/core` | Types, layout, coverage, axis helpers, and counters | Implemented |
| `react-native-roster/rrule` | Recurrence expansion, caps, provenance, and caches | Implemented |

The core uses only the standard library and `Intl`. Only the adapter imports
`rrule-temporal` 1.5.2 and `@js-temporal/polyfill` 0.5.1, pinned runtime dependencies.
React, React Native, Expo, and `@legendapp/list` are peers. Rendering also requires
`react-native-reanimated` 3.19 or later, declared optional so pure-core consumers
can omit it. Configure Reanimated in the consumer app. The demo uses 3.19.5.

## Render a roster

Give the roster a bounded height. LegendList mounts only the lanes near the viewport;
each mounted row requests its content-cached geometry.

```tsx
import { Roster } from 'react-native-roster';
import type { Lane } from 'react-native-roster/core';

const lanes: Lane[] = [{
  id: 'one', label: 'Lane one', layers: [{
    id: 'open', role: 'availability', z: 0, style: { color: '#4f9478' },
    intervals: [{
      start: Date.UTC(2024, 0, 1, 9), end: Date.UTC(2024, 0, 1, 17),
      sources: [{ kind: 'rule', id: 'one' }],
    }],
  }],
}];

export function Example() {
  return <Roster lanes={lanes} style={{ height: 480, flex: undefined }}
    windowSpec={{ span: 'week', anchorDate: '2024-01-01', timezone: 'UTC' }}
    onIntervalPress={(rect, lane) => console.log(lane.id, rect.sources)} />;
}
```

`useRoster` exposes the window, measured horizontal projection, ordered lanes,
coverage and lane-state maps, `geometryFor`, ticks, shared scrolling, `press`, and
`status`. Custom layouts wire `onLayout`; custom bodies request `geometryFor(lane)`
only for mounted lanes. Vertical scrolling updates shared offsets without React state. Default rows are 48 px high, the label column is 180 px wide, and
the time axis uses at least 0.5 px per elapsed minute. `rowHeight` and
`pxPerMinute` customize that scale. Minute steps affect ticks and snapping only.
LegendList mounts after viewport measurement, keeping static export compatible.
Its content key tracks window, projection, highlight source, and rect zone fillers.
All lane labels sit in one translated column. Ticks use arithmetic across timezone
transitions and a cache keyed by window, timezone, span, minute step, and scale.

Presses choose an interval before a gap, highest z first, with later layers winning
ties. Empty-space presses return a snapped absolute time. `highlightSource` matches
`(kind, id)` and uses the layer's `highlightColor`. Sorting defaults to `byLabel`;
`byCoverage({ measure: 'availability' | 'availabilityMinusBooking' })` sorts
coverage descending with label ties, using coverage for every lane.

Every zone is an optional render function. The exported default fillers can be
composed inside replacements.

| Zone | Input and default |
| --- | --- |
| `emptyZone` | No input; `RosterEmpty` shows No lanes. |
| `laneLabelZone` | Lane, effective flag, complete, viewTimezone, and localized labels; `RosterLaneLabel` shows label, differing timezone, and notices. |
| `headerCellZone` | Tick; `RosterHeaderCell` shows its label. |
| `intervalZone` | Rect, layer, lane, and highlighted; `RosterInterval` draws one positioned colored View. Replacements use final rect bounds and z, with pointerEvents="none" for row hit testing. |
| `gapZone` | Rect, layer, and lane; `RosterGap` draws nothing inside the row's positioned pressable. |
| `headerZone` | Ticks, projection, scroll, contentWidth, and headerCellZone; `RosterHeader` follows the shared horizontal offset. |
| `laneLabelColumnZone` | Resolved labels (LaneLabelInput per ordered lane), projection, scroll, and laneLabelZone; `RosterLaneLabelColumn` follows the shared vertical offset. |
| `bodyZone` | Ordered lanes, window, geometryFor, projection, scroll, press, viewport, ticks, contentWidth, highlightSource, and rect zones; `RosterBody` virtualizes LaneRow. |

`complete` defaults to true. Set `Lane.complete: false` to show `incompleteLabel`
(default "Availability may be incomplete"). Only explicit `never-set` shows
`neverSetLabel` (default "No availability set"). These labels are localizable props.
Neither metadata nor highlighting invalidates cached geometry.

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

## Provenance interaction

`onIntervalPress(rect, lane)`, `onGapPress(rect, lane)`, and
`onCellPress(lane, time)` report one result per press. Intervals win over gaps,
then higher z and later layers break ties. Cell times snap to `minuteStep`.
`onIntervalHover(rect, lane)` reports the winning interval as a web pointer moves;
native renders attach no hover handler. Web coordinates are relative to the row,
including after scrolling, and sources belong to the exact split span.

`highlightSource={{ kind: 'rule', id: 'shared-rule' }}` colors matching rects with
`layer.style.highlightColor`, falling back to the normal color when absent.
Identity ignores labels and object reference. Highlight changes reuse geometry.
`sortLanes` defaults to `byLabel`; `byCoverage({ measure: 'availability' })` and
`byCoverage({ measure: 'availabilityMinusBooking' })` sort descending with label
ties. Comparators receive coverage for every lane, including offscreen lanes.

Only consumers set `flag: 'never-set'`; `neverSetLabel` defaults to
"No availability set". `empty-in-window` is inferred when intervals exist but none
intersect the window, and displays no flag text. Flag changes retain rect references.
`complete: false` shows `incompleteLabel`, default "Availability may be incomplete",
in the label column and the first empty span of the row.

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

## Timezones

`WindowSpec.timezone` is the component's only view-zone input. It keeps the same
local anchor date when changed. `Lane.timezone` is display metadata: the default
label shows its IANA name when it differs from the view zone. Rule and date zones
interpret local hours only in the adapter. For example, London's 09:00 appears
at Chicago 03:00 on March 9, 2024, at 04:00 on March 10, and at 03:00 again on
March 31.

Horizontal weeks contain 167 or 169 hourly boundaries across Chicago's spring
and fall changes, including the day boundaries at midnight. Intervals align with
their wall-hour labels on this elapsed-time axis. Core columns retain 24 equal
hour bands, an empty skipped region, and two half-height repeat regions; 09:00
stays at the same y. Drawing the column regions belongs to the planned Schedule.

With the current inputs target-warm, changing Chicago's view zone to Auckland
expands zero rules inside the retained envelope, computes each visible lane's
layout once, and computes each lane's coverage once for the new window. Revisiting
retained exact keys computes nothing. A lane-zone edit preserves the geometry
reference and all three run counts. A rule-zone edit computes only the changed
rule and lane when its hours change and its new occurrence key is absent.
Coverage keys exclude projection, so a zone change with identical absolute bounds
reuses coverage, as required by the core contract.

## Gallery and platforms

The demo targets iOS, Android, and web using Expo SDK 54, Expo Router 6, React 19.1,
React Native 0.81, React Native Web 0.21, and NativeWind 4.1. React Compiler is
enabled through Expo SDK 54's `experiments.reactCompiler` app-config setting.
The home route links to empty, single-lane, two-layers, full-day-gap, never-set,
every-zone, 200-lanes, dst-week, and mixed-timezones fixtures under
`demo/app/gallery/`. Additional routes cover booking-in-gap, equal-z precedence,
highlight-rule across 20 lanes, sort-coverage across 200 lanes, and
incomplete-expansion. Each has span, minute step, view timezone, and sort controls,
plus a sources readout. The highlight and incomplete routes expand rules through
the adapter using fixtures in `test/fixtures`.
The timezone routes expand rules from `test/fixtures/timezones.ts` for the selected
window and offer March and November DST weeks. Mixed timezones shows Chicago,
London, and Auckland lanes, each with a 09:00 rule in its own zone. Other routes
retain their static fixtures.

The web-only `window.__roster` exposes live `layoutStats`, `coverageStats`,
`resetStats`, `clearLayoutCache`, and `clearCoverageCache` functions. Its identity
is stable across renders and it is removed on unmount. Only the on-screen counters
use a 500 ms snapshot. The bridge also exposes `expandStats`, `resetExpandStats`,
and `clearExpandCache` from the adapter; the display includes the cumulative
expanded count. These counters measure computation and cache reuse.
Target-warm interactions leave expansion computations, layout runs, and coverage runs
unchanged. Sorting newly visible lanes can require geometry when their exact
window and projection keys have not been visited yet.

The [Pages workflow](https://github.com/simiancraft/react-native-roster/actions/workflows/deploy-demo.yml)
builds every pull request and deploys `main` to
<https://simiancraft.github.io/react-native-roster/>. The exported gallery has been checked in Chromium for hydration, virtualized lanes,
and horizontal and vertical scrolling. Deployment and device rendering have not
yet been verified. Core workload timings run in the test gate. Device measurements, size gates, and
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
