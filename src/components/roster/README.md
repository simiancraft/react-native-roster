# Roster

This feature is about a roster; its children are lanes.

- Root entry exports: `Roster`, `useRoster`, `RosterBodyLayout`, `RosterLaneList`, the other `RosterXxx` parts, and every
  `XxxInput` slot input type from `roster.types.ts`

- `index.tsx`: the chassis; calls `useRoster`, branches on `status`, composes zones
- `use-roster.ts`: the hook; owns window, projection, scroll, geometry, and press
- `layout.tsx`: arranges corner, header, label column, and body regions only
- `roster.types.ts`: props, model, and every slot input type
- `body-layout.tsx`: arranges grid and list nodes with horizontal scroll wiring
- `parts/lane-list.tsx`: `RosterLaneList` owns LegendList and its lane render callback
- `parts/`: collection-level parts (body, header, header cell, grid, corner, label column, empty)
- `lanes/`: `LaneRow`, the interval-hover platform pair, and lane-local parts
- `utils/`: ticks and the body content key

Interval and gap components live in `../layers`; press geometry and `regionStyle`
in `../primitives`. Zone contracts are documented in the README's Roster zones
section and in `llms.txt`. Tests: `test/components/roster`.

This feature is about a roster body; its children are lanes. `RosterBody` gates
measurement and composes the body layout and lane list.

Input-bearing slots accept component types and mount in the data-owning parts.
The chassis binds defaults once; emptyZone and cornerZone accept nodes. The body
content key tracks interval and gap component identity, including class components.
