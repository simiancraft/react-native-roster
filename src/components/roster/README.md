# Roster

This feature is about a roster; its children are lanes.

- Root entry exports: `Roster`, `useRoster`, `RosterBodyLayout`, `RosterLaneList`, the other `RosterXxx` parts, and every
  `XxxInput` slot input type from `roster.types.ts`

- `index.tsx`: the chassis; calls `useRoster`, branches on `status`, composes zones
- `use-roster.ts`: the hook; owns window, projection, scroll, geometry, and selection
- `use-roster-press.ts`: isolates the stable press ref so React Compiler can retain derived body inputs
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
measurement and composes the body layout and lane list. The `onRowRender` prop on
`RosterBody` and `RosterLaneList` is a development-only Profiler hook used by the
gallery, not a supported customization point. Production Profiler callbacks are disabled.

Input-bearing slots accept component types and mount in the data-owning parts.
The chassis binds defaults once; emptyZone and cornerZone accept nodes. The body
content key tracks interval and gap component identity, including class components.

This feature is about a selection; its children are zones.

- `selection/selection-layout.types.ts`: exported `SelectionLayoutProps`, with body
  and detail nodes, anchor bounds, open, dismissal, host name, and shared scroll
- `selection/selection-layout.tsx`: exported native `RosterSelectionPopover`, local
  portal host, outside press, hardware back, measured viewport clamping, and shared scroll positioning
- `selection/selection-layout.web.tsx`: Radix presentation with a browser remap

`intervalDetailComponent` receives `IntervalDetailInput`, the interval input plus absolute
`start` and `end` and `viewTimezone`, and enables selection in `useRoster`; presses still invoke
onIntervalPress. It belongs to `RosterInput` so the hook knows whether presses select.
`selectionLayout` and `portalHost` belong to `RosterProps` because only the chassis mounts
the layout. `selectionLayout` defaults once in the chassis and wraps the body
before RosterLayout receives bodyZone. The selection never enters the body content
key. Missing lane/layer/bounds clear selection; valid selections use current data.
`portalHost` defaults to a per-roster useId name. The interval-detail fixture switches
to an inspector column with the same node contract. Schedule does not yet support selection.

The private reconcileSelection helper resolves the stored absolute bounds against the
current lanes and window each render, comparing rounded whole milliseconds to tolerate
projection roundoff. Anchors include the lane offset and interval inset. Native details
clamp horizontally and use the top edge when neither below nor above fits. The browser gate isolates selection updates from Pressable state,
and separately exercises complete pointer presses and outside dismissal.
