# react-native-roster

[![CI](https://github.com/simiancraft/react-native-roster/actions/workflows/ci.yml/badge.svg)](https://github.com/simiancraft/react-native-roster/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/simiancraft/react-native-roster)](https://codecov.io/github/simiancraft/react-native-roster)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/simiancraft/react-native-roster/badge)](https://securityscorecards.dev/viewer/?uri=github.com/simiancraft/react-native-roster)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A React Native read surface for layered intervals with provenance: a stack of lanes,
one per person or resource, against a shared time axis. Scan a column to see who is
on; scan a row to see whether someone set anything at all.

**API not yet shipped.** This repository currently contains package tooling and an
Expo Router gallery shell. The three library entry points are empty typed modules.
`Roster`, `Schedule`, the core types, and the recurrence adapter are planned APIs;
there is no usable rendering API or installation quick start yet.

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

## Planned entry points

| Import | Planned contents | Status |
| --- | --- | --- |
| `react-native-roster` | `Roster`, `Schedule`, zones, and core re-exports | Empty module |
| `react-native-roster/core` | Types, layout, axis math, comparators, and counters | Empty module |
| `react-native-roster/rrule` | Recurrence expansion adapter | Empty module |

The core will use only the standard library and `Intl`. The adapter will own
`rrule-temporal` and `@js-temporal/polyfill`; neither is a runtime dependency yet.
React, React Native, Expo, and `@legendapp/list` are peers.

## Gallery and platforms

The demo targets iOS, Android, and web using Expo SDK 54, Expo Router 6, React 19.1,
React Native 0.81, React Native Web 0.21, and NativeWind 4.1. It currently displays
`roster` and a build identity line. Fixture routes arrive under `demo/app/gallery/`.

The [Pages workflow](https://github.com/simiancraft/react-native-roster/actions/workflows/deploy-demo.yml)
builds every pull request and deploys `main` to
<https://simiancraft.github.io/react-native-roster/>. Deployment and device rendering
have not yet been verified. Performance measurements, size gates, and browser
interaction tests arrive in issue #9; no performance claims are made yet.

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
