# Roster

This feature is about a roster; its children are lanes.

- `index.tsx`: the chassis; calls `useRoster`, branches on `status`, composes zones
- `use-roster.ts`: the hook; owns window, projection, scroll, geometry, and press
- `layout.tsx`: arranges corner, header, label column, and body regions only
- `roster.types.ts`: props, model, and every zone input type
- `parts/`: collection-level parts (body, header, header cell, grid, corner, label column, empty)
- `lanes/`: `LaneRow`, the interval-hover platform pair, and lane-local parts
- `utils/`: ticks and the body content key

Interval and gap fillers live in `../layers`; press geometry and `regionStyle`
in `../primitives`. Zone contracts are documented in the README's Roster zones
section and in `llms.txt`. Tests: `test/components/roster`.
