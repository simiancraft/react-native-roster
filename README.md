# react-native-roster

**Lanes, layers, and sources on one time axis.**

[![Gallery](https://img.shields.io/badge/▶%20Gallery-lanes%2C%20layers%2C%20and%20sources-4f46e5?style=for-the-badge)](https://simiancraft.github.io/react-native-roster/)

[![CI](https://github.com/simiancraft/react-native-roster/actions/workflows/ci.yml/badge.svg)](https://github.com/simiancraft/react-native-roster/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/simiancraft/react-native-roster?logo=codecov)](https://codecov.io/github/simiancraft/react-native-roster)
[![Types: included](https://img.shields.io/badge/types-included-3178c6?logo=typescript)](#contract)
[![Core under 15 kB](https://img.shields.io/badge/core-%3C15%20kB-0f766e)](./.size-limit.json)
[![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo)](./demo/package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/simiancraft/react-native-roster/badge)](https://securityscorecards.dev/viewer/?uri=github.com/simiancraft/react-native-roster)

A read surface for React Native and web that renders who is on, when, and why.
Feed it absolute intervals with provenance; press any filled or removed span and
get back the exact rules, rows, or exclusions that produced it. Daylight-saving
transitions are drawn honestly: skipped hours are hatched, repeated hours appear
twice. `Roster` stacks many lanes horizontally; `Schedule` opens one lane as a
week of wall-clock columns. The core is standard JavaScript plus `Intl`, under
15 kB, and recurrence expansion is an optional subpath.

It is not a calendar, a booking system, or a drag-to-create editor; you own
mutations and persistence. If you want an event grid with gestures, an event
calendar library is the better fit. If you need to explain coverage across two
hundred people without lying about time zones, this is the one.

- **Provenance on every span.** Intervals and gaps carry `sources`; presses
  return the winning span's `(kind, id)` list, including the exclusion that
  removed time.
- **Honest time.** Elapsed-time roster weeks are 167 or 169 hours wide across a
  transition; schedule columns hatch skipped hours and draw repeated hours twice.
- **Layers with roles.** `availability`, `booking`, and `custom` layers stack by
  z-order; coverage math unions availability, subtracts bookings, and sorts.
- **Recurrence adapter.** Weekly, daily, and monthly rules with exclusions,
  caps, and content-keyed caches, kept out of the core.
- **Zones everywhere.** Every visual region is an optional render function, and
  every chrome region takes `style` plus a NativeWind `className` twin.
- **Virtualized and measured.** Geometry runs only for mounted lanes; CI gates
  layout, coverage, bundle size, and browser action budgets.

## Install

```sh
bun add react-native-roster @legendapp/list
bunx expo install react-native-reanimated --bun
```

The package is not yet on npm. Until the first release, build and pack this
checkout with `bun pm pack --destination .cache` and `bun add` the printed
tarball path. Keep React, React Native, and Expo aligned with your SDK; the
tested demo uses Expo SDK 54, React 19.1, React Native 0.81.5, LegendList
2.0.19, and Reanimated 3.19.5. Web also needs React DOM and React Native Web.
Peer ranges are React 18.2+, React Native 0.74+, and LegendList 2+; Reanimated
is optional for core-only use and required by `Roster`. On Metro before React
Native 0.79, enable `resolver.unstable_enablePackageExports` so the `/core`,
`/rrule`, and `/nativewind` subpaths resolve.

## Quick start: static intervals

Twenty lines, no adapter. Give the component a bounded height.

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

Press the interval to receive its `table / row-one` source. `minuteStep`
defaults to 60 and accepts any positive divisor of 60; it changes ticks and
empty-space snapping, never interval boundaries. `rowHeight` defaults to 48 and
`pxPerMinute` to a minimum of 0.5, growing to fit wider viewports.

## Quick start: recurring local hours

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
include rule. Expand once per `windowFor(spec)` in your screen's hook, never
inside a zone filler; content-keyed caches reuse unchanged occurrences. The
[adapter guide](./docs/adapters.md) covers validation, caps, cache lifetime,
and mapping tables or feeds without a recurrence dependency;
[recurrence semantics](./docs/recurrence.md) records the exact anchor, UNTIL,
COUNT, and BYSETPOS rules.

## Contract

| Term | Meaning |
| --- | --- |
| roster | Shared time axis, lanes, and layers. |
| lane | One person or resource row; `id`, `label`, `layers`, and optional display metadata. |
| layer | Ordered intervals and gaps with `id`, `role`, `z`, and `style`. |
| interval | Covered `[start, end)` in epoch milliseconds, with `sources: Source[]`. |
| gap | Removed `[start, end)` with exclusion sources; survives complete subtraction. |
| source | `{ kind, id, label? }`; identity is `(kind, id)`, never the label. |
| window | Absolute `{ start, end }` only; span and resolution belong to the axis. |
| projection | Horizontal elapsed time, or day columns with wall-clock hours. |
| adapter | Consumer-side conversion from upstream data to lanes and layers. |
| schedule | One lane projected into days across and hours down. |

`LayerRole` is `'availability' | 'booking' | 'custom'`. The first two feed
coverage math (`availabilityMinutes`, `bookingMinutes`, and
`availabilityMinusBookingMinutes`); use `custom` for anything else. `LayerStyle`
is `{ color, highlightColor?, inset?, opacity? }`; the engine applies inset on
the cross axis and returns final bounds for drawing and hit testing.

`Lane` also accepts optional data-quality fields: `version` (bump when layers
change), `timezone` (a badge), `flag: 'never-set'` for lanes you know were never
configured, `complete: false` when an adapter cap truncated the result, and
`meta` for your own display data. The notices default to "No availability set"
and "Availability may be incomplete"; both are localizable props.

## Entry points

| Import | Shipped surface |
| --- | --- |
| `react-native-roster` | `Roster`, `Schedule`, `useRoster`, `useSchedule`, zone fillers, and all core exports. |
| `react-native-roster/core` | Types, `layoutLane`, `coverageFor`, `flagFor`, axis helpers, comparators, and counters. Standard JavaScript and `Intl` only. |
| `react-native-roster/rrule` | `expandRuleSet`, `envelopeFor`, types, and expansion counters and caches. Uses pinned `rrule-temporal` and `@js-temporal/polyfill`. |
| `react-native-roster/nativewind` | Registers `Roster` and `Schedule` with NativeWind so their `className` props resolve; re-exports the registered components. |

Root and core never import recurrence dependencies. Metro selects TypeScript
source through the `react-native` export condition; other bundlers select
emitted CommonJS with declarations in `dist/src`. The emit is CommonJS, so
importing one function from the root costs the whole root bundle; import from
`/core` for a core-only bundle. Cache keys, counters, and clearing are in
[caches](./docs/caches.md).

## Navigation and interaction

A `WindowSpec` is `{ span: 'day' | 'week' | 'month', anchorDate, timezone, wkst? }`
or `{ span: 'custom', window, timezone }`. `anchorDate` is a local `YYYY-MM-DD`.
`windowFor`, `prev`, `next`, and `today` handle bounds and navigation; weeks
start Monday (weekday 0) unless `wkst` says otherwise. Components accept
`onNavigate` but ship no toolbar; your controls update the controlled spec.

Three zones take part in a render: the rule timezone interprets local hours in
the adapter, the lane timezone is a badge, and `windowSpec.timezone` drives the
projection. Changing the view zone preserves the local anchor and usually reuses
expanded occurrences. Column spans, rollbacks across midnight, and pointer
inversion are documented in [timezones](./docs/timezones.md).

Presses resolve one result: intervals before gaps, highest z first, later
layers winning equal-z ties. `onIntervalPress(rect, lane)` and
`onGapPress(rect, lane)` return the contributing sources; `onCellPress(lane,
time)` returns snapped absolute time for empty space. `onIntervalHover` is
Roster's web-only pointer callback. `highlightSource={{ kind, id }}` applies
`highlightColor` to every matching rect without new geometry. Sorting defaults
to `byLabel`; `byCoverage({ measure })` sorts by coverage descending.

## Roster zones

Every zone is an optional render function. Compose the exported default filler
inside a replacement to retain scrolling, geometry, or press behavior.

| Zone | Receives | Default filler and behavior |
| --- | --- | --- |
| `emptyZone` | Nothing | `RosterEmpty`: No lanes. |
| `cornerZone` | Nothing | `RosterCorner`: nothing; the cell above the labels, `laneLabelWidth` wide. |
| `laneLabelZone` | `lane`, `flag`, `complete`, `viewTimezone`, localized labels | `RosterLaneLabel`: label, differing IANA zone badge, and notices. |
| `headerCellZone` | `tick` | `RosterHeaderCell`: tick label. |
| `intervalZone` | `rect`, `layer`, `lane`, `highlighted` | `RosterInterval`: positioned colored rect, with final inset bounds. |
| `gapZone` | `rect`, `layer`, `lane` | `RosterGap`: no visible content; the row supplies pressable bounds. |
| `gridZone` | `ticks`, `contentWidth` | `RosterGrid`: one hairline per tick behind every lane. |
| `headerZone` | `ticks`, `projection`, `scroll`, `contentWidth`, `headerCellZone` | `RosterHeader`: frozen header following horizontal offset. |
| `laneLabelColumnZone` | `labels`, `projection`, `scroll`, `laneLabelZone` | `RosterLaneLabelColumn`: frozen labels following vertical offset. |
| `bodyZone` | Ordered `lanes`, `window`, `geometryFor`, `projection`, `scroll`, `press`, `ticks`, `viewport`, `contentWidth`, highlight and hover, incomplete label, and rect zones | `RosterBody`: virtualized lanes. |

A custom interval filler positions at `rect.x/y`, uses `rect.width/height/z`,
and sets `pointerEvents="none"` so the parent hit-test walk owns presses. Gap
fillers are already inside positioned pressables. `useRoster` exposes ordered
lanes, coverage, lane state, ticks, `geometryFor`, shared scrolling, `press`,
viewport measurement, navigation, and status for fully custom layouts.

Chrome regions take style props: `style`, `headerStyle` (the 40 px header row
holding the corner and ticks), `laneLabelColumnStyle`, and `bodyStyle`.
`laneLabelWidth` sizes the corner and label column, default 180. Each style
prop has a `className` twin; see [NativeWind](#nativewind).

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

Only day and week specs are accepted. The component measures its width,
reserves a 48 px gutter, and fits the day columns without horizontal scrolling.
`pxPerHour` defaults to 48. Chrome takes `style`, `headerStyle`, `gutterStyle`,
and `daysStyle`, each with a `className` twin.

| Zone | Receives | Default filler and behavior |
| --- | --- | --- |
| `gutterZone` | `hours`, `pxPerHour` | `ScheduleGutter`: 24 frozen hour labels. |
| `gridZone` | `hours`, `pxPerHour` | `ScheduleGrid`: 24 bordered hour bands behind each day's rects. |
| `dayHeaderZone` | `day` | `ScheduleDayHeader`: weekday, localDate, and transition badge. |
| `skippedDateZone` | `localDate` | `ScheduleSkippedDate`: zero-width header marker for a wholly skipped date. |
| `columnZone` | `day`, `rects`, `gapRects`, `lane`, `highlightSource`, `press`, interval and gap zones | `ScheduleColumn`: final rect bounds in layer order. |
| `transitionZone` | `day`, `transition`, `y`, `dividerY`, `height`, `width` | `ScheduleTransition`: skipped-time hatch, or repeat divider and again label. |
| `nowLineZone` | `y`, `column` | `ScheduleNowLine`: line in the current day's column, updated each minute. |
| `intervalZone`, `gapZone` | Same inputs as Roster | Shared `RosterInterval` and `RosterGap`. |
| `incompleteZone` | `lane`, `label` | `ScheduleIncomplete`: notice above the grid when the lane is incomplete. |

## NativeWind

`className` is a first-class prop on `Roster` and `Schedule`, alongside `style`.
Every chrome style prop has a class twin: `className`, `headerClassName`,
`laneLabelColumnClassName`, and `bodyClassName` on Roster; `className`,
`headerClassName`, `gutterClassName`, and `daysClassName` on Schedule. A class
on a region replaces that region's default paint (background and border colors)
while its structure (size, flex, overflow) stays. This is deliberate: React
Native Web renders object styles inline, and inline paint would otherwise beat
any class.

Set up NativeWind 4 as usual (the demo's [babel.config.js](./demo/babel.config.js),
[metro.config.js](./demo/metro.config.js), [tailwind.config.js](./demo/tailwind.config.js),
and [global.css](./demo/global.css) are a working reference), add the optional
peer with `bun add nativewind`, and register the components once at your app
root:

```tsx
// app/_layout.tsx
import '../global.css';
import 'react-native-roster/nativewind';
```

```tsx
import { Roster } from 'react-native-roster';

<Roster
  lanes={lanes}
  windowSpec={windowSpec}
  className="flex-1 rounded-xl bg-background"
  headerClassName="border-b border-border bg-card"
  laneLabelColumnClassName="border-r border-border bg-card"
  laneLabelWidth={220}
/>
```

Zone fillers are ordinary React Native views, so a custom `laneLabelZone` or
`intervalZone` uses `className` on `View` and `Text` directly. Without the
entry point, class props are ignored and style props still work. The entry
point is the package's only module with side effects and is listed in
`sideEffects`. The [showcase route](./demo/app/showcase.tsx) styles every region
and zone this way in light and dark palettes.

## Gallery and platform support

The [Expo gallery](https://simiancraft.github.io/react-native-roster/) is the
demo; there is no Storybook. Run it locally with `bun install --frozen-lockfile`,
`bun run build`, and `bun run demo:web` (add `EXPO_OFFLINE=1` in a restricted
network). The home page lists every fixture route:

- Empty, one, 20, and 200 lanes; inset layers; default and replaced zones.
- Day, week, and month routes at 15, 30, and 60-minute steps.
- Full-day gaps, lane flags, equal-z precedence, highlight, coverage sorting,
  and incomplete expansion.
- Chicago DST weeks, mixed rule, lane, and view zones, and editable adapter routes.
- Schedule empty, layered, excluded, spring, fall, Lord Howe, Apia, incomplete,
  midnight, side-by-side projections, and every zone.
- The showcase at `/showcase`: twelve generated people across seven zones,
  weekly hours and exclusions from the recurrence adapter, booked events, day
  and week spans, sorting, filtering, and a per-person Schedule, styled with
  NativeWind class props and zone fillers, with a sun and moon theme toggle.
  Names, titles, and the organization come from `@faker-js/faker` with a fixed
  seed; any resemblance to real people is coincidental.

| Platform | Support and evidence |
| --- | --- |
| Web via React Native Web | Static export and Chromium gallery checks; first-class target. |
| iOS | React Native implementation; device rendering and Hermes behavior not yet verified here. |
| Android | React Native implementation; device rendering and release performance not yet captured. |
| Node and Bun | Built core and adapter work without a renderer; root components require native peers or a web bundler. |

## Performance

Workload W is 200 lanes, one week, two layers, a 24-lane viewport, and
15-minute ticks: 63 interval rects and 7 gap rects per lane. The
[committed CI baseline](./test/performance/baseline.json) on GitHub Actions
ubuntu-latest records target-cold layout of 24 lanes at 2.070 ms and coverage of
all 200 lanes at 1.063 ms, gated below 16 ms everywhere and within 1.5 times the
baseline in CI. Size gates hold core under 15 kB and root under 44 kB. Device
captures and the paired comparison against other libraries are described, not
yet recorded, in the [performance guide](./docs/performance.md); CI timings are
not phone frame rates.

## What this isn't

This is a read surface. Consumers own creation, dragging, resizing,
persistence, and permission checks through their own interactions. It is not a
month grid or an arbitrary event list, and it does not expand rules inside the
core. The short [design note](./docs/design.md) explains the reasoning.

## Development and reference

```sh
bunx playwright install chromium
bun run check
```

`check` runs Biome, library, test, and demo typechecks, React Compiler safety,
the library build, the static web export, tests with coverage, knip, strict
publint, size-limit, and Playwright.

- [Adapter guide](./docs/adapters.md), [recurrence semantics](./docs/recurrence.md),
  [timezones](./docs/timezones.md), [caches](./docs/caches.md), and the
  [performance guide](./docs/performance.md).
- [Design note](./docs/design.md): precompute, then render geometry.
- [llms.txt](./llms.txt): integration instructions for agents.
- [CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md): contributor workflow.
- [CHANGELOG.md](./CHANGELOG.md): release history, maintained by semantic-release.
- [SECURITY.md](./SECURITY.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), and [NOTICE.md](./NOTICE.md).

MIT, copyright 2026 Jesse Harlin (the-simian). See [LICENSE](./LICENSE).
