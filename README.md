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
- **Zones everywhere.** Input-bearing regions accept component types, singletons accept nodes, and
  every chrome region takes `style` plus a NativeWind `className` twin.
- **Virtualized and measured.** Geometry runs only for mounted lanes; CI gates
  layout, coverage, bundle size, and browser action budgets.

## Install

```sh
bun add react-native-roster @legendapp/list
bunx expo install react-native-reanimated --bun
```

To try an unreleased checkout instead, pack it with `bun pm pack --destination
.cache` and `bun add` the printed tarball path. Keep React, React Native, and
Expo aligned with your SDK; the
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
inside a slot component; content-keyed caches reuse unchanged occurrences. The
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
| `react-native-roster` | `Roster`, `Schedule`, hooks, slot components, `RosterSelectionPopover`, `PortalHost`, `Portal`, and all core exports. |
| `react-native-roster/core` | Types, `layoutLane`, `coverageFor`, `flagFor`, `extentOf`, `intersectionOf`, axis helpers, comparators, and counters. Standard JavaScript and `Intl` only. |
| `react-native-roster/rrule` | `expandRuleSet`, `envelopeFor`, types, and expansion counters and caches. Uses pinned `rrule-temporal` and `@js-temporal/polyfill`. |
| `react-native-roster/nativewind` | Registers `Roster` and `Schedule` with NativeWind so their `className` props resolve; re-exports the registered components. |

Root and core never import recurrence dependencies. Public entry aliases retain the
implementation function identities while keeping CommonJS export overhead within the size gates. Metro selects TypeScript
source through the `react-native` export condition; other bundlers select
emitted CommonJS with declarations in `dist/src`. The emit is CommonJS, so
importing one function from the root costs the whole root bundle; import from
`/core` for a core-only bundle. Cache keys, counters, and clearing are in
[caches](./docs/caches.md).

## Core

### Interval helpers

Collapse each person's segments with `extentOf`, then use `intersectionOf` to
find the shared time across those windows. Each extent bridges gaps between
segments, so the result describes the collapsed windows.

```ts
import type { Window } from 'react-native-roster/core';
import { extentOf, intersectionOf } from 'react-native-roster/core';

const people: { name: string; segments: Window[] }[] = [
  {
    name: 'Alex',
    segments: [
      { start: 1_000, end: 3_000 },
      { start: 4_000, end: 8_000 },
    ],
  },
  {
    name: 'Sam',
    segments: [
      { start: 2_000, end: 5_000 },
      { start: 6_000, end: 9_000 },
    ],
  },
];

const windows = people.map((person): Window => {
  const extent = extentOf(person.segments);
  if (extent === null) throw new Error(`${person.name} has no segments`);
  return extent;
});
const sharedTime = intersectionOf(windows); // { start: 2_000, end: 8_000 }
// A null result from intersectionOf means there is no shared time.
```

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

The optional `now` prop accepts epoch milliseconds or `null` (the default, which
draws nothing). Pass `now={timestamp}` to draw a vertical 2 px red line across the
body at the projected instant. Only `window.start <= now < window.end` is visible.
The caller owns clock updates; Roster starts no timer. `useRoster` exposes `now` and `nowLine`.
`now` retains the raw instant. `nowLine` (`{ x, now }`) uses the fitted
`pxPerMinute` scale and is null when `now` is null or outside the window.
Replace `nowLineComponent` to customize the line using `RosterNowLineInput`
(`{ x, now }`). The line follows horizontal scrolling; changing `now` does not
invalidate mounted lanes. The every-zone gallery fixture can toggle a fixed
instant at the window midpoint.

## Roster zones

Props ending in `Component` accept `ComponentType<Input>` and are mounted by React.
Props ending in `Zone` accept `ReactNode`. Define components at module scope so
state survives rerenders; hooks and class components are supported. Compose the
exported default components inside replacements to retain scrolling, geometry,
or press behavior. Pass `null` to a node slot to suppress its default.

| Slot | Component inputs or node | Default and behavior |
| --- | --- | --- |
| `emptyZone` | `ReactNode` | `RosterEmpty`: No lanes. |
| `cornerZone` | `ReactNode` | `RosterCorner`: nothing; the cell above the labels, `laneLabelWidth` wide. |
| `laneLabelComponent` | `lane`, `flag`, `complete`, `viewTimezone`, localized labels | `RosterLaneLabel`: label, differing IANA zone badge, and notices. |
| `headerCellComponent` | `HeaderCellInput` (`tick`) | `RosterHeaderCell`: tick label. |
| `intervalComponent` | `rect`, `layer`, `lane`, `highlighted` | `RosterInterval`: positioned colored rect, with final inset bounds. |
| `intervalDetailComponent` | `rect`, `layer`, `lane`, `highlighted`, absolute `start` and `end`, `viewTimezone` | Absent by default; enables selection and fills its details. |
| `selectionLayout` | `SelectionLayoutProps`: nodes, anchor, open, dismissal, host, and shared scroll | `RosterSelectionPopover`: native portal or Radix web popover; replace at runtime. |
| `gapComponent` | `rect`, `layer`, `lane` | `RosterGap`: no visible content; the row supplies pressable bounds. |
| `nowLineComponent` | `RosterNowLineInput` (`x`, `now`) | `RosterNowLine`: noninteractive vertical red line across the body. |
| `gridComponent` | `ticks`, `contentWidth` | `RosterGrid`: one hairline per tick behind every lane. |
| `headerComponent` | `ticks`, `projection`, `scroll`, `contentWidth`, `headerCellComponent` | `RosterHeader`: frozen header following horizontal offset. |
| `laneLabelColumnComponent` | `labels`, `projection`, `scroll`, `laneLabelComponent` | `RosterLaneLabelColumn`: frozen labels following vertical offset. |
| `bodyComponent` | Ordered `lanes`, `window`, `geometryFor`, `projection`, `scroll`, `press`, `ticks`, `viewport`, `contentWidth`, `nowLine`, `nowLineComponent`, highlight and hover, incomplete label, and rect components | `RosterBody`: virtualized lanes. |

`RosterBody` composes `RosterBodyLayout`, which arranges `gridZone`, `listZone`, and optional `overlayZone`
nodes with scroll wiring, and `RosterLaneList`, which owns LegendList and its
per-lane callback. The body waits for viewport measurement before mounting the list.

```tsx
import type { LaneLabelInput } from 'react-native-roster';
import { Text } from 'react-native';

function LaneLabel({ lane }: LaneLabelInput) {
  return <Text>{lane.label}</Text>;
}

<Roster lanes={lanes} windowSpec={windowSpec}
  laneLabelComponent={LaneLabel} cornerZone={<Text>People</Text>} />
```

A custom interval component positions at `rect.x/y`, uses `rect.width/height/z`,
and sets `pointerEvents="none"` so the parent hit-test walk owns presses. Gap
fillers are already inside positioned pressables. `useRoster` exposes ordered
lanes, coverage, lane state, ticks, `geometryFor`, shared scrolling, `press`,
viewport measurement, navigation, and status for fully custom layouts.

Chrome regions take style props: `style`, `headerStyle` (the 40 px header row
holding the corner and ticks), `laneLabelColumnStyle`, and `bodyStyle`.
`laneLabelWidth` sizes the corner and label column, default 180. Each style
prop has a `className` twin; see [NativeWind](#nativewind).

### Selection

Add `intervalDetailComponent` to enable pressed-interval details. The press still
fires `onIntervalPress`; without the component, presses retain no selection.
`useRoster` owns `selection` and `dismissSelection`.
Pressing the selected interval again dismisses it; pressing another interval
switches selection. Cell and gap presses dismiss selection while still firing
`onCellPress` and `onGapPress`. These rules live in the hook and apply on native
and web; web outside press and Escape still dismiss.
Removing the selected lane, layer, or interval bounds clears selection.
Current data and geometry replace old
references, including after resizing or sorting. Reconciliation matches the layer id and
order-insensitive source identities, then chooses the nearest absolute bounds. The sum
of bound differences must be less than one pixel of time at the current projection
scale or 1 ms, whichever is larger. Stored bounds remain the display values.

`intervalDetailComponent` lives on `RosterInput` because `useRoster` owns selection
and must know whether presses select. `selectionLayout` and `portalHost` live on
`RosterProps` because only the chassis mounts the layout. When building a custom
chassis, pass `intervalDetailComponent` to `useRoster` and mount your layout with
the returned selection, dismissal, and scroll inputs.

```tsx
import { Text, View } from 'react-native';
import { Roster } from 'react-native-roster';
import type { IntervalDetailInput, Lane } from 'react-native-roster';

function IntervalDetails({ lane, layer, rect, start, end, viewTimezone }: IntervalDetailInput) {
  const format = new Intl.DateTimeFormat('en-US', { timeZone: viewTimezone, timeStyle: 'short' });
  return <View style={{ padding: 16, backgroundColor: 'white' }}>
    <Text>{lane.label}: {layer.label ?? layer.id}</Text>
    <Text>{format.format(start)} to {format.format(end)}</Text>
    {rect.sources.map((source) =>
      <Text key={JSON.stringify([source.kind, source.id])}>
        {source.label ?? source.id}
      </Text>)}
  </View>;
}

export function SelectionExample({ lanes }: { lanes: Lane[] }) {
  return <Roster lanes={lanes}
    windowSpec={{ span: 'day', anchorDate: '2024-01-01', timezone: 'UTC' }}
    style={{ height: 480, flex: undefined }}
    intervalDetailComponent={IntervalDetails} />;
}
```

Web consumers install `bun add @radix-ui/react-popover`. It is an optional peer
for native and core-only consumers, and required by the web root entry. Consumers
resolving the library from source with a web bundler (Vite, Storybook, or Metro web)
must install it even without enabling selection because `selection-layout.web.tsx`
is in the module graph. Native and core-only consumers do not need it.
`RosterSelectionPopover` selects native or web through platform resolution.
Native mounts a local `PortalHost` and registers `Portal` content; web uses Radix
for portal placement, outside click, Escape, focus, and collision handling.
The overlay tracks both scroll offsets with Reanimated shared values, without
React scroll state. Native clamps details horizontally to the measured viewport,
flips above when that fits, and uses the top edge when neither vertical placement
fits. The default native popover waits for viewport measurement and scrolls oversized
content on both axes within a maximum size of the viewport minus 8 px on each axis.
Consumers wanting a different presentation supply `selectionLayout`.
Native also dismisses on outside press and hardware back.

`selectionLayout?: ComponentType<SelectionLayoutProps>` is the layout strategy
naming exception to the `Component` suffix. The chassis mounts it with `anchorZone`
(the body), `contentZone` (details or null), `anchor` (body-content bounds), `open`,
`onDismiss`, `portalHost`, and `scroll`. The anchor includes the lane offset and
interval inset. Render each node once. A consumer inspector
can arrange the nodes in columns and call `onDismiss` from its close button.
The [interval-detail gallery route](./demo/app/gallery/interval-detail.tsx)
switches presentations at runtime.

`portalHost` overrides the native destination name, whose default uses a unique
per-roster `useId`. Give separate rosters separate override names. The default
layout owns its host; do not also mount that name at an ancestor. Custom layouts
can instead target their own ancestor host, using the exported `PortalHost` and
`Portal`. A store-based portal does not preserve context from the registration
site; place required providers above the host or re-provide them in the content.
Selection never enters the lane list's body content key.

Schedule does not yet support selection; it is a later change.

### Consumer data in slot components

For consumer data beyond a slot's Input, mount a React context provider above
`Roster` and read it with `useContext` in a module-scope slot component. This
example supplies density and locale while keeping the header cell type stable:

```tsx
import { createContext, useContext } from 'react';
import { Text } from 'react-native';
import type { HeaderCellInput, RosterProps } from 'react-native-roster';
import { Roster } from 'react-native-roster';

type SlotPreferences = {
  density: 'compact' | 'comfortable';
  locale: string;
};

const SlotPreferencesContext = createContext<SlotPreferences>({
  density: 'comfortable',
  locale: 'en-US',
});

function LocalizedHeaderCell({ tick }: HeaderCellInput) {
  const { density, locale } = useContext(SlotPreferencesContext);
  const label = new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    ...(tick.kind === 'day'
      ? { month: 'short', day: 'numeric' }
      : { hour: 'numeric', minute: '2-digit' }),
  }).format(tick.time);

  return (
    <Text numberOfLines={1} style={{ padding: density === 'compact' ? 2 : 6 }}>
      {label}
    </Text>
  );
}

export function ConsumerRoster({ lanes }: Pick<RosterProps, 'lanes'>) {
  return (
    <SlotPreferencesContext.Provider value={{ density: 'compact', locale: 'en-GB' }}>
      <Roster
        lanes={lanes}
        windowSpec={{ span: 'week', anchorDate: '2024-01-01', timezone: 'UTC' }}
        style={{ height: 480, flex: undefined }}
        headerCellComponent={LocalizedHeaderCell}
      />
    </SlotPreferencesContext.Provider>
  );
}
```

An inline closure or a memoized factory that returns a new component per render
is not the recommended path. A new interval component type remounts every interval
and defeats the body's content key. Context supplies changing consumer data while
preserving the module-scope component type.

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

| Slot | Component inputs or node | Default and behavior |
| --- | --- | --- |
| `gutterComponent` | `hours`, `pxPerHour` | `ScheduleGutter`: 24 frozen hour labels. |
| `gridComponent` | `hours`, `pxPerHour` | `ScheduleGrid`: 24 bordered hour bands behind each day's rects. |
| `dayHeaderComponent` | `day` | `ScheduleDayHeader`: weekday, localDate, and transition badge. |
| `skippedDateComponent` | `localDate` | `ScheduleSkippedDate`: zero-width header marker for a wholly skipped date. |
| `columnComponent` | `day`, `rects`, `gapRects`, `lane`, `highlightSource`, `press`, interval and gap components | `ScheduleColumn`: final rect bounds in layer order. |
| `transitionComponent` | `day`, `transition`, `y`, `dividerY`, `height`, `width` | `ScheduleTransition`: skipped-time hatch, or repeat divider and again label. |
| `nowLineComponent` | `y`, `column` | `ScheduleNowLine`: line in the current day's column, updated each minute. |
| `intervalComponent`, `gapComponent` | Same inputs as Roster | Shared `RosterInterval` and `RosterGap`. |
| `incompleteComponent` | `lane`, `label` | `ScheduleIncomplete`: notice above the grid when the lane is incomplete. |

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

Slot components are ordinary React Native views, so a custom `laneLabelComponent` or
`intervalComponent` uses `className` on `View` and `Text` directly. Without the
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
  NativeWind class props and slot components, with a sun and moon theme toggle.
  Names, titles, and the organization come from `@faker-js/faker` with a fixed
  seed. Each event compares scheduled time with seeded attendee arrivals and departures,
  using a bottom strip and selection popover. A fixed demo clock separates future, live, and
  past events. Attendees are expected, pending, present, attended, or absent;
  present bars extend to now without recording a departure.
  Any resemblance to real people is coincidental.

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

- [Migrations](https://github.com/simiancraft/react-native-roster/blob/main/docs/migrations.md) lists prop renames by version with before-and-after examples.
- [Adapter guide](./docs/adapters.md), [recurrence semantics](./docs/recurrence.md),
  [timezones](./docs/timezones.md), [caches](./docs/caches.md), and the
  [performance guide](./docs/performance.md).
- [Design note](./docs/design.md): precompute, then render geometry.
- Area landing pages: [core](./src/core/README.md), [Roster](./src/components/roster/README.md),
  [Schedule](./src/components/schedule/README.md), [layers](./src/components/layers/README.md),
  [primitives](./src/components/primitives/README.md), [rrule adapter](./src/adapters/rrule/README.md),
  [nativewind](./src/nativewind/README.md), the [gallery](./demo/components/gallery/README.md), and the
  [showcase](./demo/components/team-roster/README.md), and the [theme](./demo/components/theme/README.md);
  [adding an adapter](./docs/adding-an-adapter.md)
  is the contributor recipe.
- [llms.txt](./llms.txt): integration instructions for agents.
- [CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md): contributor workflow.
- [CHANGELOG.md](./CHANGELOG.md): release history, maintained by semantic-release.
- [SECURITY.md](./SECURITY.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), and [NOTICE.md](./NOTICE.md).

MIT, copyright 2026 Jesse Harlin (the-simian). See [LICENSE](./LICENSE).
