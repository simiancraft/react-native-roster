<p align="center">
  <a href="https://simiancraft.github.io/react-native-roster/showcase">
    <img src="https://raw.githubusercontent.com/simiancraft/react-native-roster/main/docs/assets/hero.png" alt="Twelve people as lanes on a shared day axis with a red now line, beside one person's week as a schedule" width="860" />
  </a>
</p>

<p align="center">
  <a href="https://simiancraft.github.io/react-native-roster/showcase">
    <img src="https://img.shields.io/badge/▶%20Live%20demo-4f46e5?style=for-the-badge" alt="Live demo" />
  </a>
</p>

# react-native-roster

[![npm version](https://img.shields.io/npm/v/react-native-roster?color=cb3837&logo=npm)](https://www.npmjs.com/package/react-native-roster)
[![CI](https://github.com/simiancraft/react-native-roster/actions/workflows/ci.yml/badge.svg)](https://github.com/simiancraft/react-native-roster/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/simiancraft/react-native-roster?logo=codecov)](https://codecov.io/github/simiancraft/react-native-roster)
[![Types: included](https://img.shields.io/npm/types/react-native-roster?color=3178c6&logo=typescript)](https://www.npmjs.com/package/react-native-roster)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/simiancraft/react-native-roster/badge)](https://securityscorecards.dev/viewer/?uri=github.com/simiancraft/react-native-roster)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/simiancraft/react-native-roster/blob/main/LICENSE)

**"Why is nobody on Wednesday?"** Rosters and schedules for React Native and web. Press the empty Wednesday and it names the dentist appointment that emptied it.

```tsx
<Roster
  lanes={lanes}
  windowSpec={windowSpec}
  onGapPress={(rect) => console.log(rect.sources)} // [{ kind: 'date', id: 'dentist' }]
/>
```

A staffing screen gets asked who is on right now, who is free at 3, and why
nobody is on Wednesday. The third question needs the rule behind the rectangle,
so every interval and gap keeps its sources. Press an interval to get the sources
that produced it; press a gap to get the sources that removed it.
The showcase derives gap presentation from the complete source set: its authored lunch rules are
partial, its authored PTO dates are whole-day, and unknown, absent, or mixed sources stay neutral.
Width only controls whether the source-derived label is visible in either projection.

Give each person or resource a lane. `Roster` draws every lane on one time axis;
`Schedule` draws any one of them as a week, days across and hours down. The same
lane feeds both.

`Roster` draws elapsed time, so the week the clocks change is 167 or 169 hours
wide; `Schedule` hatches the hour they skipped.

It does not create, drag, or resize anything, and it has no month grid; if you
need those, reach for [react-native-calendar-kit](https://github.com/howljs/react-native-calendar-kit)
or [react-native-big-calendar](https://github.com/acro5piano/react-native-big-calendar).

[Browse every example](https://simiancraft.github.io/react-native-roster/) in the gallery.

## Quickstart

### Install

These steps assume an Expo app.

1. Add the package and LegendList:

   ```sh
   bun add react-native-roster @legendapp/list
   ```

2. Add Reanimated for your Expo SDK:

   ```sh
   bunx expo install react-native-reanimated --bun
   ```

3. For web, add React DOM, React Native Web, and Radix Popover; every web build needs all three:

   ```sh
   bunx expo install react-dom react-native-web --bun
   bun add '@radix-ui/react-popover@^1.1.23'
   ```

Without Expo, follow the [Reanimated install guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/)
for 3.19 or newer. On React Native older than 0.79, turn on
`resolver.unstable_enablePackageExports` in Metro.

The workspace demo routes the root, `/core`, `/rrule`, and `/nativewind` imports through each
export's `react-native` condition on web, iOS, and Android. Metro therefore compiles TypeScript
source edits without rebuilding `dist`; the resolver still uses the package export map rather than
an alias, and leaves peer and unrelated-package resolution unchanged. Restart the demo server if a
source edit is not detected.

### Roster

The smallest useful roster: Alex works 09:00 to 17:00 UTC on Monday, and a table
row says so. `Roster` fills its parent by default; here it gets a fixed height.

```tsx
import { Roster } from 'react-native-roster';
import type { Lane } from 'react-native-roster/core';

const lane: Lane = {
  id: 'alex',
  label: 'Alex',
  layers: [
    {
      id: 'working-hours',
      role: 'availability',
      z: 0,
      style: { color: '#4f9478' },
      intervals: [
        {
          start: Date.UTC(2026, 8, 21, 9),
          end: Date.UTC(2026, 8, 21, 17),
          sources: [{ kind: 'table', id: 'alex-monday' }],
        },
      ],
    },
  ],
};

export function RosterExample() {
  return (
    <Roster
      lanes={[lane]}
      style={{ height: 480, flex: undefined }}
      windowSpec={{ span: 'day', anchorDate: '2026-09-21', timezone: 'UTC' }}
      onIntervalPress={(rect, pressedLane) => {
        console.log(pressedLane.label, rect.sources); // Alex [{ kind: 'table', id: 'alex-monday' }]
      }}
    />
  );
}
```

Add lanes for more people. Add layers and they stack by `z`.

### Schedule

Hand `Schedule` that same `lane` and it draws days across and hours down. It
takes day and week windows.

```tsx
import { Schedule } from 'react-native-roster';

export function ScheduleExample() {
  return (
    <Schedule
      lane={lane}
      style={{ height: 480, flex: undefined }}
      windowSpec={{ span: 'week', anchorDate: '2026-09-21', timezone: 'UTC' }}
    />
  );
}
```

### Recurrence from rrule

The `/rrule` adapter turns daily, weekly, and monthly rules into intervals and
gaps. Here is the Wednesday from the top of this page: weekdays 09:00 to 17:00
in New York, and a dentist appointment on the 23rd. Press the empty day and it
names `dentist`.

```tsx
import { Roster } from 'react-native-roster';
import { windowFor } from 'react-native-roster/core';
import type { Lane, WindowSpec } from 'react-native-roster/core';
import { expandRuleSet } from 'react-native-roster/rrule';
import type { RuleSet } from 'react-native-roster/rrule';

const windowSpec: WindowSpec = {
  span: 'week',
  anchorDate: '2026-09-21',
  timezone: 'America/New_York',
};

const ruleSet: RuleSet = {
  rules: [
    {
      id: 'weekday-hours',
      kind: 'include',
      frequency: 'WEEKLY',
      dtstart: '2026-09-21',
      byweekday: [0, 1, 2, 3, 4],
      hourstart: 9,
      hourend: 17,
      timezone: 'America/New_York',
    },
  ],
  dates: [
    { id: 'dentist', kind: 'exclude', date: '2026-09-23', timezone: 'America/New_York' },
  ],
};

const result = expandRuleSet(ruleSet, windowFor(windowSpec)); // 4 intervals, 1 gap

const recurringLane: Lane = {
  id: 'alex',
  label: 'Alex',
  timezone: 'America/New_York',
  complete: result.complete,
  layers: [
    {
      id: 'working-hours',
      role: 'availability',
      z: 0,
      style: { color: '#4f9478' },
      intervals: result.intervals,
      gaps: result.gaps,
    },
  ],
};

export function RecurringRosterExample() {
  return (
    <Roster
      lanes={[recurringLane]}
      windowSpec={windowSpec}
      style={{ height: 480, flex: undefined }}
      onGapPress={(rect) => console.log(rect.sources)} // [{ kind: 'date', id: 'dentist' }]
    />
  );
}
```

When the window can change, expand for the selected window in your screen's
hook. The [adapter guide](https://github.com/simiancraft/react-native-roster/blob/main/docs/adapters.md)
covers live data; the [recurrence reference](https://github.com/simiancraft/react-native-roster/blob/main/docs/recurrence.md)
lists the supported rules.

### NativeWind

react-native-roster supports [NativeWind](https://www.nativewind.dev/).

1. Install NativeWind 4.1 or newer and finish its
   [setup](https://www.nativewind.dev/docs/getting-started/installation):

   ```sh
   bun add 'nativewind@^4.1'
   ```

2. Register the components once, in your app's root module:

   ```tsx
   import 'react-native-roster/nativewind';
   ```

3. Style with class props:

   ```tsx
   <Roster
     className="rounded-xl bg-white"
     headerClassName="bg-slate-100"
     laneLabelColumnClassName="bg-slate-100"
     {...rest}
   />
   ```

Every style prop has a `className` twin; the
[NativeWind page](https://github.com/simiancraft/react-native-roster/blob/main/src/nativewind/README.md)
lists them.

## Customization

You can replace every region: header cells, lane labels, intervals, gaps, the
grid, the now line, and the detail popover. Props ending in `Component` take a
component type; props ending in `Zone` take a node. If you want your own layout
entirely, `useRoster` and `useSchedule` return the same models the components
render from. See [customization](https://github.com/simiancraft/react-native-roster/blob/main/docs/customization.md).

## Size and support

Core geometry and coverage caches accept an optional `ScopedCacheIdentity`. Keep one stable empty
identity object per dataset, and pass it to both `layoutLane` and `coverageFor`; independent
datasets then cannot collide when they reuse lane IDs and versions. Omitting the identity uses the
core-owned default, while deliberately reusing one identity shares target-warm coverage across
projections.

Every mounted `Roster`, `Schedule`, `useRoster`, and `useSchedule` surface owns an isolated
identity by default. Pass a stable `cacheIdentity` only when several surfaces render the same
dataset and should deliberately share target-warm geometry and coverage.

Each identity retains at most 2,000 least-recently-used layout entries and 2,000
least-recently-used coverage entries. The loaded roster scope retains at most 2,000
least-recently-used tick entries, and the loaded layers scope retains at most 2,000
least-recently-used layer style entries shared by both projections. Core also retains 2,000 day
columns, 2,000 date starts, and 100 timezone formatters in shared least-recently-used maps. Cache
hits refresh recency. `clearCaches()` clears geometry, these calendar and zone maps, and every other
cache scope whose module has loaded and registered its cleanup, including roster ticks and layer
styles after their scopes load; counters remain cumulative. Loading the `/rrule` entry registers its
occurrence and envelope caches without making core import recurrence dependencies; `clearCaches()`
and `clearExpandCache()` then clear the same recurrence entries and preserve expansion counters. See
[caches](https://github.com/simiancraft/react-native-roster/blob/main/docs/caches.md).

Minified, with peers external: `/core` is 15.5 kB and the root entry is 53.2 kB.
`/rrule` adds 12.9 kB of its own code plus its two dependencies, `rrule-temporal`
and `@js-temporal/polyfill`, which install with the package. Web runs in CI on
every ready pull request. iOS and Android are implemented but have not been
verified on devices yet. Tested against Expo SDK 54, React Native 0.81, and
Reanimated 3.19.

## Reference

| Import | What you get |
| --- | --- |
| `react-native-roster` | `Roster`, `Schedule`, `useRoster`, `useSchedule`, the default slot components, and everything in `/core`. |
| `react-native-roster/core` | Types, layout, coverage, interval helpers, and window navigation. Standard JavaScript and `Intl` only. |
| `react-native-roster/rrule` | `expandRuleSet`, `envelopeFor`, and their caches. The only entry that imports `rrule-temporal` and `@js-temporal/polyfill`. |
| `react-native-roster/nativewind` | Registers the components with NativeWind. |

- [Customization](https://github.com/simiancraft/react-native-roster/blob/main/docs/customization.md): slots, selection, and passing your data to slot components.
- [Adapters](https://github.com/simiancraft/react-native-roster/blob/main/docs/adapters.md) and [recurrence](https://github.com/simiancraft/react-native-roster/blob/main/docs/recurrence.md): getting upstream data into lanes.
- [Timezones](https://github.com/simiancraft/react-native-roster/blob/main/docs/timezones.md): rule, lane, and view timezones; skipped and repeated hours.
- [Caches](https://github.com/simiancraft/react-native-roster/blob/main/docs/caches.md): keys, versions, and clearing.
- [Design note](https://github.com/simiancraft/react-native-roster/blob/main/docs/design.md): why intervals, and why geometry is computed before render.
- [Migrations](https://github.com/simiancraft/react-native-roster/blob/main/docs/migrations.md): prop renames by version.
- [llms.txt](https://github.com/simiancraft/react-native-roster/blob/main/llms.txt): the full contract, defaults, and edge cases in one file, written for coding agents.

## Contributing

[CONTRIBUTING.md](https://github.com/simiancraft/react-native-roster/blob/main/CONTRIBUTING.md)
has setup and the commit rules; merging to `main` releases. Report security
issues through [SECURITY.md](https://github.com/simiancraft/react-native-roster/blob/main/SECURITY.md).
Release history is in the [changelog](https://github.com/simiancraft/react-native-roster/blob/main/CHANGELOG.md).

## License

MIT © [the-simian](https://github.com/the-simian). See [LICENSE](https://github.com/simiancraft/react-native-roster/blob/main/LICENSE).

<sub>Looking for a React Native resource timeline, staff scheduler, shift calendar, or Gantt-style roster and landed here another way? The package name is **react-native-roster**.</sub>

<p align="center"><sub>Crafted with care by <a href="https://simiancraft.com">Simiancraft</a>.</sub></p>

<p align="center"><sub>Recurrence in <code>/rrule</code> runs on <a href="https://github.com/ggaabe/rrule-temporal">rrule-temporal</a> and <a href="https://github.com/js-temporal/temporal-polyfill">@js-temporal/polyfill</a>; lanes virtualize through <a href="https://github.com/LegendApp/legend-list">LegendList</a>. Every person and organization in the demo is generated. Full attributions: <a href="https://github.com/simiancraft/react-native-roster/blob/main/NOTICE.md">NOTICE.md</a>.</sub></p>
