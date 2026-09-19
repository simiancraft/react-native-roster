# react-native-roster

**Resource timeline and schedule components for React Native and web, with layered intervals, coverage, provenance, and explicit daylight-saving handling.**

[![npm version](https://img.shields.io/npm/v/react-native-roster?color=cb3837&logo=npm)](https://www.npmjs.com/package/react-native-roster)
[![CI](https://github.com/simiancraft/react-native-roster/actions/workflows/ci.yml/badge.svg)](https://github.com/simiancraft/react-native-roster/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/simiancraft/react-native-roster?logo=codecov)](https://codecov.io/github/simiancraft/react-native-roster)
[![Types: included](https://img.shields.io/badge/types-included-3178c6?logo=typescript)](#contract)
[![Core under 15 kB](https://img.shields.io/badge/core-%3C15%20kB-0f766e)](./.size-limit.json)
[![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo)](./demo/package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/simiancraft/react-native-roster/badge)](https://securityscorecards.dev/viewer/?uri=github.com/simiancraft/react-native-roster)

**Live demo: [explore the gallery](https://simiancraft.github.io/react-native-roster/)
or [try the showcase](https://simiancraft.github.io/react-native-roster/showcase).**

<!-- HERO GIF PLACEHOLDER: insert a recorded gallery or showcase tour here when available. -->

Give it lanes of absolute intervals and their sources. Get a resource timeline
across many lanes, or a day-column schedule for one lane, with coverage totals
and press callbacks that explain exactly which sources produced each span.

**It renders who is on, when, and why.** Press any covered or removed span and
get back the rules, rows, or exclusions behind it; removed time keeps its
exclusion sources. Daylight-saving transitions are drawn honestly: skipped hours
are hatched, repeated hours have separate geometry, and a week containing a
transition is 167 or 169 hours wide. `Roster` and `Schedule` project the same
lane data; `useRoster` and `useSchedule` expose their models for custom layouts.

Consumers own creation, dragging, resizing, and persistence. It ships
virtualized roster lanes, replaceable components, NativeWind chrome, and a small
standard JavaScript and `Intl` core with a [15 kB size gate](./.size-limit.json).

## Install

```sh
bun add react-native-roster @legendapp/list
bunx expo install react-native-reanimated --bun
```

For web, also install React DOM and React Native Web versions compatible with
your React/Expo setup, plus `bun add @radix-ui/react-popover@^1.1.23`.
**Radix is required whenever a web bundler resolves the root entry or
`/nativewind` to the web selection layout, even with selection disabled or only
`Schedule` imported.** That layout imports Radix unconditionally; the published
browser remap and Metro's web source resolution both reach it. Native and
`/core`-only or `/rrule`-only imports do not require Radix.

Peer ranges: React >=18.2, React Native >=0.74, LegendList >=2, Reanimated >=3.19,
Expo >=51 (optional), NativeWind >=4.1 (optional), and Radix ^1.1.23 (web).
Reanimated is required by `Roster` and optional for core-only use. Keep React,
React Native, and Expo aligned with your SDK. The demo uses Expo SDK 54,
React 19.1, React Native 0.81.5, LegendList 2.0.19, and Reanimated 3.19.5;
these versions do not establish support for every peer-range combination.

On Metro before React Native 0.79, enable `resolver.unstable_enablePackageExports`
so the subpaths resolve. Keep one React copy in workspaces.
`rrule-temporal` and `@js-temporal/polyfill` install as ordinary dependencies;
only `/rrule` imports them. Import isolation does not reduce installation size.

## Quick start: static intervals

Give the component a bounded height. No adapter is needed for absolute intervals.

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
`pxPerMinute` to 0.5, growing to fit wider viewports. Both scale and row height
must be positive and finite.

## Quick start: recurring local hours

Import `expandRuleSet` from `/rrule` to turn daily, weekly, or monthly local
hours and dated exclusions into intervals and gaps. Expand for `windowFor(spec)`
in your screen's hook, and carry `result.complete` into `Lane.complete`.
The [runnable recurring example](./docs/adapters.md#quick-start-recurring-local-hours)
shows the complete mapping; [recurrence semantics](./docs/recurrence.md) covers
validation, COUNT, UNTIL, and BYSETPOS. Never expand inside a slot component.

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
| `react-native-roster` | `Roster`, `Schedule`, hooks, slot components, `RosterSelectionPopover`, `PortalHost`, `Portal`, and all core exports. |
| `react-native-roster/core` | Types, `layoutLane`, `coverageFor`, `flagFor`, `extentOf`, `intersectionOf`, `unionOf`, axis helpers, comparators, and counters. Standard JavaScript and `Intl` only. |
| `react-native-roster/rrule` | `expandRuleSet`, `envelopeFor`, types, and expansion counters and caches. Uses pinned `rrule-temporal` and `@js-temporal/polyfill`. |
| `react-native-roster/nativewind` | Registers `Roster` and `Schedule` with NativeWind so their `className` props resolve; re-exports the registered components. |

Root and core never import recurrence dependencies. Metro selects TypeScript
source; the default condition selects CommonJS, and `types` selects declarations
in `dist/src`.
The CommonJS root pulls in the root bundle; use `/core` for core-only consumers.

## Caches

Bump a supplied `lane.version` whenever layers change; otherwise structural layer
content supplies the key. Treat returned references as read-only. Consumers own
cache lifetime: clear layout, coverage, and expansion caches when discarding old
windows. Coverage runs for all lanes; geometry runs for mounted lanes.
[Cache keys, counters, and clearing](./docs/caches.md) explain target-warm reuse.

## Core

### Interval helpers

`extentOf`, `intersectionOf`, and `unionOf` operate on end-exclusive absolute
windows. Extents bridge gaps; unions preserve disjoint spans. See the
[helper walkthrough](./src/core/README.md#interval-helper-walkthrough).

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

## Now line

Pass controlled `now={timestamp}` to Roster; `null` (the default) draws nothing.
The caller owns clock updates. Only instants inside the end-exclusive window are visible. Replace `nowLineComponent` to style it; the
[Roster reference](./src/components/roster/README.md) covers hook and scroll behavior.

## Roster zones

Props ending in `Component` accept component types; props ending in `Zone`
accept React nodes. Define slot components at module scope to preserve state.
Use exported defaults inside replacements to retain geometry and interaction.
The [slot tables and examples](./docs/customization.md#roster-zones) cover every region.

### Selection

Add `intervalDetailComponent` for pressed-interval details. Pressing the same
interval dismisses it; pressing another switches selection. Cell and gap presses
also dismiss, preserving their callbacks. Web outside press and Escape dismiss.
Schedule does not support selection. Custom `selectionLayout` implementations
must follow the [layout and portal contract](./docs/customization.md#selection),
including unique native host names and provider placement above the host.

### Consumer data in slot components

Use context with stable slot types; see the [complete recipe](./docs/customization.md#consumer-data-in-slot-components).

## Schedule and its zones

Pass the same lane to `<Schedule lane={lane} windowSpec={spec} />` with a bounded
height. Schedule accepts day and week specs, fits columns to measured width,
and reserves a 48 px gutter. `pxPerHour` defaults to 48 and must be positive and
finite. Its automatic now line updates each minute. See the
[example and slot table](./docs/customization.md#schedule-zones).

## NativeWind

Install NativeWind >=4.1 and configure it for your app, then import
`react-native-roster/nativewind` once at the root. Every chrome style prop has a
`className` twin; classes replace default paint while preserving structure.
Slot components use `className` on ordinary views. Without registration, class
props are ignored. [Setup, examples, and demo configuration](./src/nativewind/README.md#setup-and-styling)
show all regions, including the [showcase route](./demo/app/showcase.tsx).

## Gallery and platform support

The gallery covers lane counts, layer precedence, coverage sorting, provenance,
DST transitions, editable recurrence, and replaceable components. The showcase
combines filtering, per-lane schedules, and attendance details. See the
[fixture catalog and local setup](./demo/components/gallery/README.md#run-the-gallery-and-explore-fixtures)
and [showcase tour](./demo/components/team-roster/README.md#showcase-tour).

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
baseline in CI. Minified, uncompressed size gates with peers external hold core under 15 kB and root under 52 kB. Device
captures and the paired comparison against other libraries are described, not
yet recorded, in the [performance guide](./docs/performance.md); CI timings are
not phone frame rates.

## Compared to

| Alternative | Choose it for | What react-native-roster adds to that model |
| --- | --- | --- |
| [react-native-calendar-kit](https://howljs.github.io/react-native-calendar-kit/) | Creation/editing gestures and pinch-to-zoom in a React Native calendar. | Layer-role coverage math and exact source sets on covered and removed spans. |
| [react-native-big-calendar](https://github.com/acro5piano/react-native-big-calendar) | Day, week, and month views of events. | A many-resource timeline and a single-lane schedule over the same layered interval contract. |
| [FullCalendar's resource timeline](https://fullcalendar.io/docs/timeline-view) | A web resource timeline with [dragging and resizing](https://fullcalendar.io/docs/event-dragging-resizing). | React Native components plus a renderer-free coverage/provenance core and explicit skipped/repeated wall-time geometry. |

These are differences in the supplied models, not claims that an alternative
cannot be extended. Their linked documentation describes their features; this
package's [contract](./src/core/types.ts), [coverage](./src/core/coverage.ts), and
[geometry](./docs/timezones.md) document its side. No relative performance
comparison has been recorded; see [performance evidence](./docs/performance.md).

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

- [Migrations](https://github.com/simiancraft/react-native-roster/blob/main/docs/migrations.md) lists prop renames by version with before-and-after examples.
- [Adapter guide](./docs/adapters.md), [recurrence semantics](./docs/recurrence.md),
  [timezones](./docs/timezones.md), [caches](./docs/caches.md), and the
  [performance guide](./docs/performance.md).
- [Design note](./docs/design.md): precompute, then render geometry.
- Area landing pages: [core](./src/core/README.md), [Roster](./src/components/roster/README.md),
  [Schedule](./src/components/schedule/README.md), [layers](./src/components/layers/README.md),
  [primitives](./src/components/primitives/README.md), [rrule adapter](./src/adapters/rrule/README.md),
  [nativewind](./src/nativewind/README.md), the [gallery](./demo/components/gallery/README.md), the
  [showcase](./demo/components/team-roster/README.md), and the [theme](./demo/components/theme/README.md);
  [adding an adapter](./docs/adding-an-adapter.md)
  is the contributor recipe.
- [llms.txt](./llms.txt): integration instructions for agents.
- [CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md): contributor workflow.
- [CHANGELOG.md](./CHANGELOG.md): release history, maintained by semantic-release.
- [SECURITY.md](./SECURITY.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), and [NOTICE.md](./NOTICE.md).

MIT, copyright 2026 Jesse Harlin (the-simian). See [LICENSE](./LICENSE).
