# react-native-roster

[![Gallery](https://img.shields.io/badge/▶%20Gallery-lanes%2C%20layers%2C%20and%20sources-4f46e5?style=for-the-badge)](https://simiancraft.github.io/react-native-roster/)

[![Types: included](https://img.shields.io/badge/types-included-3178c6?logo=typescript)](#contract)
[![CI](https://github.com/simiancraft/react-native-roster/actions/workflows/ci.yml/badge.svg)](https://github.com/simiancraft/react-native-roster/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/simiancraft/react-native-roster?logo=codecov)](https://codecov.io/github/simiancraft/react-native-roster)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/simiancraft/react-native-roster/badge)](https://securityscorecards.dev/viewer/?uri=github.com/simiancraft/react-native-roster)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A **roster** is a stack of lanes, one per person or resource, against a shared time
axis. Each lane contains layers of intervals. Scan a column to see who is on;
press a filled or removed span to see exactly which sources produced it.
`Roster` shows many lanes horizontally. `Schedule` shows one lane with days across
and wall-clock hours down. Both render the same interval data and provenance.

**The two read surfaces, the adapter, and the automated gates are implemented;
the package is unreleased on npm.** Device evidence and the predecessor comparison
are not yet captured. Use the repository demo
or a locally built package. Geometry, coverage, recurrence expansion, timezone
transitions, replaceable zones, and the performance gates are implemented.

## Start with the demo

Use Bun 1.4.0 and Node 22. From this repository's checkout:

```sh
bun install --ignore-scripts --frozen-lockfile
bun run build
bun run demo:web
```

One root install supplies the demo workspace too. In an offline or restricted
environment, use `EXPO_OFFLINE=1 bun run demo:web` to skip Expo's online dependency
validation. Open the URL printed by Expo;
choose **Single lane**, **Adapter: includes and exclusions**, or **One lane: Roster
and Schedule**. No service, account, or data download is needed.

To run the quick start below, save it as `demo/app/gallery/readme-example.tsx`,
changing `export function Example` to `export default function Example` for Expo
Router. Open `/gallery/readme-example` on that same local server. It shows a green
09:00 to 17:00 interval on January 1, 2024; scroll the time axis to see it.
Remove this scratch route when finished. The fixed date makes the example repeatable.

For an existing Expo app, build and pack this checkout:

```sh
bun pm pack --destination .cache
```

In your app, `bun add /absolute/path/to/react-native-roster-0.0.0.tgz` using the
actual tarball path printed by that command, then `bun add @legendapp/list` and
`bunx expo install react-native-reanimated --bun`. Keep the app's compatible React,
React Native, and Expo versions. The tested demo uses Expo SDK 54, React 19.1,
React Native 0.81.5, LegendList 2.0.19, and Reanimated 3.19.5. Its
[babel.config.js](./demo/babel.config.js) shows the Expo and NativeWind Babel presets used by this workspace.
NativeWind is optional; see [NativeWind](#nativewind) for the `className` entry
point. Web consumers also need React DOM and React Native Web compatible with
their Expo SDK.

## Quick start: static intervals

Twenty lines, with no adapter required. Give the component a bounded height.

```tsx
import { Roster } from 'react-native-roster';
import type { Lane } from 'react-native-roster/core';

const lanes: Lane[] = [{
  id: 'one', label: 'Lane one', layers: [{
    id: 'open', role: 'availability', z: 0,
    style: { color: '#4f9478' },
    intervals: [{
      start: Date.UTC(2024, 0, 1, 9), end: Date.UTC(2024, 0, 1, 17),
      sources: [{ kind: 'table', id: 'row-one' }],
    }],
  }],
}];

export function Example() {
  return <Roster lanes={lanes}
    style={{ height: 480, flex: undefined }}
    windowSpec={{ span: 'week', anchorDate: '2024-01-01', timezone: 'UTC' }}
    onIntervalPress={(rect, lane) => console.log(lane.id, rect.sources)} />;
}
```

Press the interval to receive its `table / row-one` source. `minuteStep` defaults
to 60; any positive integer divisor of 60 is accepted. It changes ticks and
empty-space pointer snapping, never interval boundaries. `rowHeight` defaults
to 48 and `pxPerMinute` to a minimum of 0.5, growing to fit wider viewports.

## Quick start: recurring local hours

The adapter is an explicit subpath import. Every rule and date is validated even
for zero-duration windows. Recurrence keeps its original `dtstart` so changing
the display window preserves phase; out-of-envelope occurrences consume no cap.
Expand once for the selected window,
then map the result into a layer. This complete example can replace the static
example in the same scratch route (use a default export for Expo Router).

```tsx
import { Roster } from 'react-native-roster';
import type { Lane, WindowSpec } from 'react-native-roster/core';
import { windowFor } from 'react-native-roster/core';
import { expandRuleSet } from 'react-native-roster/rrule';
import type { RuleSet } from 'react-native-roster/rrule';

const spec: WindowSpec = {
  span: 'week', anchorDate: '2024-01-01', timezone: 'America/Chicago',
};
const set: RuleSet = {
  rules: [{
    id: 'weekday-hours', kind: 'include', frequency: 'WEEKLY',
    dtstart: '2024-01-01', byweekday: [0, 1, 2, 3, 4],
    hourstart: 9, hourend: 17, timezone: 'America/Chicago',
  }],
  dates: [{
    id: 'closed', kind: 'exclude', date: '2024-01-02',
    timezone: 'America/Chicago', note: 'Closed all day',
  }],
};
const result = expandRuleSet(set, windowFor(spec));
const lane: Lane = {
  id: 'one', label: 'Lane one', timezone: 'America/Chicago',
  complete: result.complete,
  layers: [{
    id: 'open', role: 'availability', z: 0, style: { color: '#4f9478' },
    intervals: result.intervals, gaps: result.gaps,
  }],
};

export function RecurringExample() {
  return <Roster lanes={[lane]} windowSpec={spec}
    style={{ height: 480, flex: undefined }}
    onGapPress={(rect) => console.log(rect.sources)} />;
}
```

Tuesday is a gap carrying the dated exclusion; the other weekdays carry the
include rule. In a controlled screen, expand for each selected `windowFor(spec)`;
content-keyed caches reuse unchanged occurrences. Do not expand inside row or
zone fillers. Propagate `complete` even when no intervals remain. The
[adapter guide](./docs/adapters.md) covers validation, caps, cache lifetime, and
mapping other sources without a recurrence dependency.

## Contract

| Term | Meaning |
| --- | --- |
| roster | Shared time axis, lanes, and layers. |
| lane | One person or resource row; `id`, `label`, `layers`, and optional display metadata. |
| layer | Ordered intervals and gaps with `id`, `role`, `z`, and `style`. |
| interval | Covered `[start, end)` in epoch milliseconds, with `sources: Source[]`. |
| gap | Removed `[start, end)` with exclusion sources; survives complete subtraction. |
| source | `{ kind, id, label? }`; identity is `(kind, id)`, never the label or object reference. |
| window | Absolute `{ start, end }` only; no span or resolution. |
| projection | Horizontal elapsed time, or day columns with wall-clock hours. |
| adapter | Consumer-side conversion from upstream data to lanes and layers. |
| schedule | One lane projected into days across and hours down. |

`LayerRole` is exactly `'availability' | 'booking' | 'custom'`. Coverage unions
intervals across layers with each role, clipped to the window:
`availabilityMinutes`, `bookingMinutes`, and `availabilityMinusBookingMinutes`.
Gaps are not subtracted again; adapters already removed them from intervals.
`LayerStyle` is `{ color, highlightColor?, inset?, opacity? }`. The engine applies
inset on the cross axis and returns final bounds for drawing and hit testing.

`Lane` also accepts `version`, `timezone`, `flag`, `complete`, and `meta`.
Only the consumer can assert `flag: 'never-set'`. With no explicit flag, intervals
outside the window yield `empty-in-window`; otherwise the flag is `none`.
An empty array cannot prove that a lane was never configured. `complete: false`
shows `incompleteLabel` (default "Availability may be incomplete"); `neverSetLabel`
defaults to "No availability set". Both labels are localizable component props.

## Entry points and caches

| Import | Shipped surface |
| --- | --- |
| `react-native-roster` | `Roster`, `Schedule`, `useRoster`, `useSchedule`, zone fillers, and all core exports. |
| `react-native-roster/core` | Types, `layoutLane`, `coverageFor`, `flagFor`, axis helpers, comparators, and counters. Standard JavaScript and `Intl` only. |
| `react-native-roster/rrule` | `expandRuleSet`, `envelopeFor`, types, and expansion counters/caches. Uses pinned `rrule-temporal` 1.5.2 and `@js-temporal/polyfill` 0.5.1. |
| `react-native-roster/nativewind` | Registers `Roster` and `Schedule` with NativeWind so their `className` props resolve; re-exports the registered components. Requires the optional `nativewind` peer. |

Root/core never import recurrence dependencies, though the package installation
includes them. Metro selects TypeScript source through the `react-native` export
condition; other bundlers select emitted CommonJS, with declarations in
`dist/src`. Reanimated is an optional peer for core-only use, required for Roster.

Layout runs for mounted lanes; coverage runs for all lanes before sorting.
Geometry keys include lane id, version (or a structural encoding of layers),
window, and every projection field. Coverage keys omit projection. **Bump a
supplied `lane.version` whenever layers change.** Labels, lane timezone, flags,
completeness, and metadata do not invalidate rects. Treat returned references as
read-only. `clearLayoutCache()` and `clearCoverageCache()` release retained keys;
clear them when a consumer discards old windows. They do not reset counters.

`layoutStats()` and `coverageStats()` return `{ runs, cacheHits }`;
`resetStats()` resets both without clearing caches. `expandStats()` returns
`{ rules, dates, expanded, cacheHits, cacheMisses }`; `resetExpandStats()` resets
those counters, and `clearExpandCache()` clears occurrence and envelope caches.
One shared LRU retains four envelopes across sets by default; containment selects
the most recently used matching envelope, including after a rule edit.
**Target-warm** means the exact target keys exist; **target-cold** means they are
absent. A retained envelope alone does not guarantee retained occurrence entries.

## Navigation, timezones, and interaction

A `WindowSpec` is `{ span: 'day' | 'week' | 'month', anchorDate, timezone, wkst? }`,
or `{ span: 'custom', window, timezone }`. `anchorDate` is a local `YYYY-MM-DD`,
not an instant. `windowFor`, `prev`, `next`, and `today` handle bounds and
navigation. Week starts Monday by default; weekday numbering is Monday = 0
through Sunday = 6. Components accept `onNavigate`, but ship no toolbar;
consumer controls call these helpers and update the controlled `windowSpec`.

Rule/date timezone interprets local hours in the adapter. Lane timezone is a
badge only. View timezone is `windowSpec.timezone`, the component's only view-zone
input. Changing it preserves the local anchor; the padded expansion envelope
usually reuses occurrences for that local week. Expansion retains the original
anchor unless it is exactly local midnight with interval 1 (or absent) and no COUNT.
Such rules may skip whole periods in plain-date space while preserving the
weekly weekday and monthly day, and stepping back past nonexistent dates.
Date-only UNTIL admits only local dates at or before the authored date, even when
its final hour or the whole date is skipped. Local datetime UNTIL compares plain
date-times at the authored anchor's wall time, without normalizing skipped hours.
Explicit-offset UNTIL compares exact instants, preferring an explicit-offset
DTSTART's offset during repeats and using compatible disambiguation otherwise.
A datetime UNTIL before DTSTART admits nothing.
Date-only and local-datetime DTSTART preserve their authored date and time, even
inside a skipped date or hour. Explicit-offset DTSTART remains an instant whose
wall fields and offset come from the rule's zone. The engine iterates those wall
fields in UTC calendar space.
Every rule enumerates from the period containing DTSTART at the anchor wall time,
aligned to WKST for WEEKLY and day 1 for MONTHLY, so interval phases follow the
DTSTART period rather than the first matching date. Dates before DTSTART are
rejected before COUNT and cap admission.
DAILY weekday filters are applied by the adapter to the authored daily sequence
because the engine otherwise re-anchors at the first matching date.
The engine uses the end of UNTIL's local date as a conservative UTC enumeration bound.
Explicit-offset UNTIL uses the end of the following local date instead; exact instant
admission is its only UNTIL admission test. Clamp either bound to the corresponding
UTC calendar bound of the envelope query.
The enumeration bound is conservative through the wall date after any cross-date rollback
at the envelope end, and envelope clipping discards the extra candidates.
The adapter owns BYSETPOS after every other BYxxx filter, grouping plain dates
by day, WKST week, or year-month before deduplication, UNTIL, COUNT, and cap admission.
Positional enumeration includes complete edge periods, then rejects dates before
DTSTART and spans outside the envelope. The engine iteration limit is the number
of authored periods from the enumeration anchor through the query bound, so empty
candidate periods terminate completely without an arbitrary cutoff. Only that
exact engine limit error signals completed enumeration; other failures propagate.
Replayed iterator passes stop before buffering positional candidates.
YEARLY is unsupported and rejected by input validation.
The adapter drops wholly nonexistent
dates before counting existing dates from the original anchor for COUNT. A skipped
date never becomes a different weekday or consumes COUNT. UNTIL admission stays consistent across direct expansion and
retained envelopes.
A new absolute window requires coverage; a new projection requires geometry. Equal absolute bounds reuse coverage.

Presses resolve one result: intervals before gaps, highest z first, and later
layers winning equal-z ties. `onIntervalPress(rect, lane)` and
`onGapPress(rect, lane)` return the exact contributing sources.
`onCellPress(lane, time)` returns snapped absolute time for empty space, clamped
up to `window.start` and rejected at or beyond `window.end`. Positive windows use
their exact elapsed width, including sub-minute spans; a zero-duration window
renders no Roster body.
`onIntervalHover(rect, lane)` is Roster's web-only pointer callback.
`highlightSource={{ kind: 'rule', id: 'one' }}` uses `highlightColor` across all
matching rects without new geometry. Sorting defaults to `byLabel`;
`byCoverage({ measure: 'availability' | 'availabilityMinusBooking' })` sorts
coverage descending, with label ties, including offscreen lanes.

## Roster zones

Every zone is an optional render function. Compose exported default fillers in a
replacement when you want to retain scrolling, geometry, or press behavior.

| Zone | Receives | Default filler and behavior |
| --- | --- | --- |
| `emptyZone` | Nothing | `RosterEmpty`: No lanes. |
| `laneLabelZone` | `lane`, `flag`, `complete`, `viewTimezone`, localized labels | `RosterLaneLabel`: label, differing IANA zone badge, and notices. |
| `headerCellZone` | `tick` | `RosterHeaderCell`: tick label. |
| `intervalZone` | `rect`, `layer`, `lane`, `highlighted` | `RosterInterval`: positioned colored rect, with final inset bounds. |
| `gapZone` | `rect`, `layer`, `lane` | `RosterGap`: no visible content; the row supplies pressable bounds. |
| `gridZone` | `ticks`, `contentWidth` | `RosterGrid`: one hairline per tick behind every lane. |
| `cornerZone` | Nothing | `RosterCorner`: nothing; the cell above the labels, `laneLabelWidth` wide. |
| `headerZone` | `ticks`, `projection`, `scroll`, `contentWidth`, `headerCellZone` | `RosterHeader`: frozen header following horizontal offset. |
| `laneLabelColumnZone` | `labels: LaneLabelInput[]`, `projection`, `scroll`, `laneLabelZone` | `RosterLaneLabelColumn`: frozen labels following vertical offset. |
| `bodyZone` | Ordered `lanes`, `window`, `geometryFor`, `projection`, `scroll`, `press`, `ticks`, `viewport`, `contentWidth`, highlight/hover, incomplete label, and rect zones | `RosterBody`: virtualized lanes. |

A custom interval filler positions at `rect.x/y`, uses `rect.width/height/z`, and
sets `pointerEvents="none"` so the parent hit-test walk owns presses. Gap fillers
are already inside positioned pressables. The
[default zones](./demo/app/gallery/default-zones.tsx) and
[replacements](./demo/app/gallery/every-zone.tsx) use the same lanes.
`useRoster` exposes ordered lanes, coverage, lane state, ticks, `geometryFor`,
shared scrolling, `press`, viewport measurement, navigation, and status. Custom
layouts wire `onLayout`; custom bodies request geometry only for mounted lanes.

Chrome regions take style props: `style` (outer container), `headerStyle` (the
40 px header row holding the corner and ticks), `laneLabelColumnStyle`, and
`bodyStyle`. `laneLabelWidth` sizes the corner and label column, default 180.
Each style prop has a `className` twin; see [NativeWind](#nativewind).

## Schedule and its zones

```tsx
import { Schedule } from 'react-native-roster';
import type { Lane } from 'react-native-roster/core';

export function Week({ lane }: { lane: Lane }) {
  return <Schedule lane={lane} minuteStep={60}
    style={{ height: 600, flex: undefined }}
    windowSpec={{ span: 'week', anchorDate: '2024-01-01', timezone: 'UTC' }}
    onIntervalPress={(rect) => console.log(rect.sources)} />;
}
```

Only day and week specs are accepted. The component measures its width, reserves
a 48 px gutter, and fits actual day columns without horizontal scrolling.
`pxPerHour` defaults to 48 and must be positive and finite. `useSchedule` returns
`window`, `days`, `projection`, `geometry`, `now`, `press(columnIndex, x, y)`, and
`status: 'ready'`; standalone hooks use a 280 px grid.

| Zone | Receives | Default filler and behavior |
| --- | --- | --- |
| `gutterZone` | `hours`, `pxPerHour` | `ScheduleGutter`: 24 frozen hour labels. |
| `gridZone` | `hours`, `pxPerHour` | `ScheduleGrid`: 24 bordered hour bands behind each day's rects. |
| `dayHeaderZone` | `day` | `ScheduleDayHeader`: weekday, localDate, and transition badge. |
| `skippedDateZone` | `localDate` | `ScheduleSkippedDate`: zero-width header marker for a wholly skipped date. |
| `columnZone` | `day`, `rects`, `gapRects`, `lane`, `highlightSource`, `press`, interval/gap zones | `ScheduleColumn`: final rect bounds in layer order. |
| `transitionZone` | `day`, `transition`, `y`, `dividerY`, `height`, `width` | `ScheduleTransition`: skipped-time hatch, or repeat divider and again label. |
| `nowLineZone` | `y`, `column` | `ScheduleNowLine`: line in the current day's column, updated each minute. |
| `intervalZone`, `gapZone` | Same inputs as Roster | Shared `RosterInterval` and `RosterGap`. |
| `incompleteZone` | `lane`, `label` | `ScheduleIncomplete`: notice in reserved space above the grid when incomplete. |

Every day has 24 equal wall-hour bands. Skipped time is empty and fires no press;
repeated time has two half-height regions resolving to different instants.
Each column spans its date's first instant to the next date's first instant.
Rollbacks across midnight, such as St_Johns in 2009 and Goose_Bay in 1988, retain
that absolute span and compress earlier-date instants into a repeat at the top
edge, ending where ordinary wall time resumes. Pointer inversion preserves the
absolute occurrence. The repeat divider uses the projected transition instant,
including when the surviving repeat regions have unequal heights.
Skipped wall spans belong to the date they interrupt; its transitions include a
skip at the column's exclusive end when it empties that date's final bands, such
as Nuuk's 23:00 to 24:00 on 2024-03-30. Those bands are hatched and reject presses.
A wholly skipped date has no column. Horizontal Roster instead uses true elapsed
time, so Chicago's transition weeks are 167 and 169 hours wide. Rects split at
midnight, offset scale boundaries, and source-set changes. Column x coordinates
reset per column; `rect.column` selects it. `timeAtX(projection, window, x)` and
`timeAtY(projection, columnIndex, y)` invert these mappings; only pointer results
use `snapToStep`. Inverse times stay below each scale piece's exclusive end,
including for pointers immediately inside the bottom edge.
The [zone route](./demo/app/gallery/schedule-every-zone.tsx) offers defaults/replacements, Apia, Chicago transitions, and the current now line.
Schedule chrome takes `style`, `headerStyle` (day heading row), `gutterStyle`,
and `daysStyle` (the column container), each with a `className` twin.

## NativeWind

`className` is a first-class prop on `Roster` and `Schedule`, alongside `style`.
Every chrome style prop has a class twin: `className`, `headerClassName`,
`laneLabelColumnClassName`, and `bodyClassName` on Roster; `className`,
`headerClassName`, `gutterClassName`, and `daysClassName` on Schedule. Class
props are resolved by NativeWind into the matching style prop. A class on a
region replaces that region's default paint (background and border colors) while
its structure (size, flex, overflow) stays, so `headerClassName="border-b
border-zinc-800 bg-zinc-900"` fully restyles the header row. This is deliberate:
React Native Web renders object styles inline, and inline paint would otherwise
beat any class.

Set up NativeWind 4 as usual (the demo's [babel.config.js](./demo/babel.config.js),
[metro.config.js](./demo/metro.config.js), [tailwind.config.js](./demo/tailwind.config.js),
and [global.css](./demo/global.css) are a working reference), install the optional
peer with `bun add nativewind`, then register the components once at your app
root before any screen renders:

```tsx
// app/_layout.tsx
import '../global.css';
import 'react-native-roster/nativewind';
```

After that, the root imports accept class props anywhere JSX is compiled with the
NativeWind preset:

```tsx
import { Roster } from 'react-native-roster';

<Roster
  lanes={lanes}
  windowSpec={windowSpec}
  className="flex-1 rounded-xl bg-zinc-950"
  headerClassName="bg-zinc-900 border-zinc-800"
  laneLabelColumnClassName="bg-zinc-900 border-zinc-800"
  laneLabelWidth={220}
/>
```

Zone fillers are ordinary React Native views, so a custom `laneLabelZone`,
`intervalZone`, or `headerCellZone` uses `className` on `View` and `Text`
directly; the entry point only covers the components the library owns. Without
the entry point, class props are ignored and style props still work. The entry
point is the package's only module with side effects and is listed in
`sideEffects`. The [showcase route](./demo/app/showcase.tsx) styles every region
and zone this way.

## Gallery and platform support

The [Expo gallery](https://simiancraft.github.io/react-native-roster/) is the demo;
there is no Storybook. Its home page lists every fixture route:

- Empty, one, 20, and 200 lanes; inset layers; default and replaced zones.
- Day, week, and month routes at each of 15, 30, and 60-minute steps.
- Full-day gaps, lane flags, equal-z precedence, sources, highlight across 20 lanes,
  sorting 200 lanes by both coverage measures, and incomplete expansion.
- Chicago DST weeks, mixed rule/lane/view zones, and three editable adapter routes.
- Schedule empty, layered, excluded, spring, fall, Lord Howe, Apia, incomplete,
  midnight, side-by-side projections, and every zone.
- The showcase at `/showcase`: twelve Faker-generated people across seven zones,
  weekly hours and exclusions from the recurrence adapter, booked events, day and
  week spans, sorting, filtering, and a per-person Schedule, all styled with
  NativeWind class props and zone fillers.

Roster routes have span, minute step, view zone, and sort controls. Schedule
routes have day/week, step, view zone, and projection controls without sort.
Adapter routes add JSON through `ruleSetEditorZone`, backed by `useRuleSetDraft` (stacked above the roster on narrow screens);
Apply validates the draft and retains the last valid roster on error. The 200-lane
route exposes live `window.__roster` counter functions and manual device controls.
The [Pages workflow](./.github/workflows/deploy-demo.yml) builds pull requests and
is configured to deploy from `main`; deployment is not verified by local export.

| Platform | Support and evidence |
| --- | --- |
| Web via React Native Web | Static export and Chromium gallery checks; first-class target. |
| iOS | React Native implementation; device rendering and Hermes behavior not yet verified here. |
| Android | React Native implementation; device rendering and release performance not yet captured. |
| Node/Bun | Built core and adapter work without a renderer; root components require native peers or a web bundler. |

Core timezone arithmetic uses `Intl.DateTimeFormat.formatToParts`. Browser tests
and native host doubles do not establish physical-device behavior. The tested
demo dependency versions above are narrower evidence than the declared peer
ranges (React >=18.2, React Native >=0.74, Expo >=51, and LegendList >=2).

## Performance

Workload W: seed 1318, 200 lanes, one week, two layers, a 24-lane viewport, and
15-minute ticks. Each lane produces **63 interval rects and 7 gap rects**.
These are geometry counts, not a claim about all React Native views.

The [committed CI baseline](./test/performance-baseline.json) records
**2026-09-08 05:18 UTC**, **Bun 1.4.0**, **GitHub Actions ubuntu-latest**, commit
`1c4ac0e8580b1d46c043f946aa7ebc1ee316d0fa`. Values are medians of 11 target-cold
samples after five runtime warmups, from a clean checkout:

| Measurement | Recorded result | Gate |
| --- | ---: | --- |
| Layout of 24 lanes | 2.070 ms | <16 ms; also <=1.5 times baseline in CI. |
| Coverage of all 200 lanes | 1.063 ms | <16 ms; also <=1.5 times baseline in CI. |
| Pixel 6a class release build, five-second fling | Not yet captured | 60 fps, zero dropped frames. |
| Same device, next-week layout of 24 lanes | Not yet captured | Each capture <16 ms. |
| Device model, date, and exact release commit | Not yet captured | Required with traces and screenshots per release. |

[Performance evidence](./docs/performance.md) defines the measurement boundaries,
size gates (core <15 kB, root <40 kB, minified/uncompressed with peers external),
Chromium action assertions, and device capture procedure. Local tests enforce
the absolute timing gates; the relative timing gates run only in CI. Production
web disables React Profiler callbacks; a separate development export checks
actual LegendList LaneRow commits with active mount and update controls. Bun host
tests remain complementary, and a native LaneRow profile is still required for release.

| Same-machine comparison | react-native-roster | react-big-scheduler wrapper |
| --- | --- | --- |
| Target-cold preparation, 24 lanes | Not yet measured in paired run | Not yet measured |
| Five-second scroll fps and dropped frames | Not yet measured in paired run | Not yet measured |
| Machine, browser, date, and commits | Not yet measured | Not yet measured |

No relative-speed claim is justified before the paired capture described in the
performance guide. CI timing numbers are not phone frame rates.

## What this isn't

This is a read surface. Consumers own creation, dragging, resizing, persistence,
and permission checks through their own interactions. It is not a general
calendar with a month grid or arbitrary event list, and it does not expand rules
inside the core. See the short [design note](./docs/design.md) for the reasoning.

## Development and reference

```sh
bunx playwright install chromium
bun run check
```

`check` runs Biome, library/test/demo typechecks, React Compiler safety, library
build, static web export, tests with coverage, knip, strict publint, size-limit,
and Playwright. For a worktree-local browser cache, set
`PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/playwright"` on both commands. To keep Bun
scratch/cache writes local, set `TMPDIR="$PWD/.cache/tmp"` and
`BUN_INSTALL_CACHE_DIR="$PWD/.cache/bun"` after creating those directories.

- [Adapter guide](./docs/adapters.md): mapping tables or feeds and retaining occurrences.
- [Design note](./docs/design.md): precompute, then render geometry.
- [llms.txt](./llms.txt): integration instructions for agents.
- [CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md): contributor workflow.
- [CHANGELOG.md](./CHANGELOG.md): release history, maintained by semantic-release.
- [SECURITY.md](./SECURITY.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), and [NOTICE.md](./NOTICE.md).

MIT, copyright 2026 Jesse Harlin (the-simian). See [LICENSE](./LICENSE).
