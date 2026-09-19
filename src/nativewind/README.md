# nativewind entry

Registers `Roster` and `Schedule` with NativeWind's `cssInterop` so each
`xxxClassName` prop resolves into the matching `xxxStyle` chrome region.

- Public subpath: `react-native-roster/nativewind`
- Exports: `Roster`, `Schedule`, `rosterClassNames`, `scheduleClassNames`
- The package's one side-effect module; listed in `sideEffects`
- The only module that imports the optional `nativewind` peer

Class props win over default paint because layouts compose regions with
`regionStyle`, which drops the default when the override carries a class entry.
Fine detail is styled through zones. See [setup and styling](#setup-and-styling).
Web imports also require Radix through Roster; see [Install](../../README.md#install).
Tests: `test/package/nativewind-entry.test.ts`.

## Setup and styling

`className` is a first-class prop on `Roster` and `Schedule`, alongside `style`.
Every chrome style prop has a class twin: `className`, `headerClassName`,
`laneLabelColumnClassName`, and `bodyClassName` on Roster; `className`,
`headerClassName`, `gutterClassName`, and `daysClassName` on Schedule. A class
on a region replaces that region's default paint (background and border colors)
while its structure (size, flex, overflow) stays. This is deliberate: React
Native Web renders object styles inline, and inline paint would otherwise beat
any class.

Set up NativeWind 4 as usual (the demo's [babel.config.js](../../demo/babel.config.js),
[metro.config.js](../../demo/metro.config.js), [tailwind.config.js](../../demo/tailwind.config.js),
and [global.css](../../demo/global.css) are a working reference), add the optional
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
`sideEffects`. The [showcase route](../../demo/app/showcase.tsx) styles every region
and zone this way in light and dark palettes.
