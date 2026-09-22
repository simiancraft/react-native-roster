# Roster

This feature is about a roster; its children are lanes.

- Root entry exports: `Roster`, `useRoster`, `RosterBodyLayout`, `RosterLaneList`, the other `RosterXxx` parts, and every
  `XxxInput` slot input type from `roster.types.ts`

- `index.tsx`: the chassis; calls `useRoster`, branches on `status`, composes zones
- `use-roster.ts`: the hook; owns window, projection, nowLine, scroll, geometry, and selection
- `use-roster-press.ts`: isolates the stable press ref so React Compiler can retain derived body inputs
- `focus-safe-clip.ts` / `focus-safe-clip.web.ts`: platform clipping styles with a browser remap
- `parts/label-wheel.tsx` / `parts/label-wheel.web.tsx`: web wheel routing to the lane list, with shared types and a browser remap; native is a no-op
- `layout.tsx`: arranges corner, header, label column, and body regions only
- `roster.types.ts`: props, model, and every slot input type
- `body-layout.tsx`: arranges grid, list, and optional absolute overlay nodes with horizontal scroll wiring
- `parts/lane-list.tsx`: `RosterLaneList` owns LegendList and its lane render callback
- `parts/`: collection-level parts (body, header, header cell, grid, now line, corner, label column, empty)
- `lanes/`: `LaneRow`, the interval-hover platform pair, and lane-local parts
- `utils/`: ticks and the body content key

Interval and gap components live in `../layers`; press geometry and `regionStyle`
in `../primitives`. See the [slot tables, selection contract, and context recipe](../../../docs/customization.md#roster-zones)
and `llms.txt` for integration details. Tests: `test/components/roster`.

This feature is about a roster body; its children are lanes. `RosterBody` gates
measurement and composes the body layout and lane list. `BodyInput` extends the
positive `LaneListInput` with ticks, grid, and now-line inputs; the body explicitly
picks the lane-list props. The `onRowRender` prop on
`RosterBody` and `RosterLaneList` is a development-only Profiler hook used by the
gallery, not a supported customization point. Production Profiler callbacks are disabled.

Input-bearing slots accept component types and mount in the data-owning parts.
The chassis binds defaults once; emptyZone and cornerZone accept nodes. The body
content key tracks interval, gap, and incomplete component identity, including class components.
The layout uses non-scrolling web clips around translated header and lane-label
content, preventing focus from offsetting either region independently. Native keeps
overflow clipping on the same regions. The label column routes vertical wheel input
(including trackpad pixels and line/page delta modes) to the existing web list scroller.
Horizontal wheel input never offsets labels independently. Native behavior is unchanged.
List scroll events alone update the shared translation, without React state updates.

`now` is a controlled epoch millisecond value, default null. `useRoster` derives
`nowLine` (`{ x, now }`) during render via `xAtTime` using the fitted horizontal
scale; it is null when `now` is null or outside the end-exclusive window. The model
retains the raw `now` instant. The exported `RosterNowLine` fills the body's `overlayZone`
with a noninteractive 2 px red line; `nowLineComponent` accepts the exported
`RosterNowLineInput` (`{ x, now }`). The overlay scrolls horizontally with the
content. Now values and component identity never enter the lane list or body
content key. The caller owns clock updates.

Each `Roster` or `useRoster` instance owns a stable `ScopedCacheIdentity` by default, isolating
datasets whose lane IDs and versions collide. The optional `cacheIdentity` input replaces that
owned identity so multiple surfaces can deliberately share one dataset's target-warm entries. The
resolved identity is used consistently for coverage, `geometryFor`, press hit-testing, and
selection reconciliation.

The loaded roster scope retains at most 2,000 tick entries in one least-recently-used cache; hits
refresh recency. It registers tick cleanup with `clearCaches()`, which is repeatable, so cleared or
evicted inputs regenerate equal tick content.

`selection/` holds the runtime-swappable presentation strategies (native popover, web popover) for one `SelectionLayoutProps` contract.

- `selection/selection-layout.types.ts`: exported `SelectionLayoutProps`, with body
  and detail nodes, targetBounds, open, dismissal, host name, and shared scroll
  limited to x, y, headerStyle, and labelStyle
- `selection/selection-layout.tsx`: exported native `RosterSelectionPopover`, local
  portal host, body press passthrough, hardware back, measured viewport clamping, and shared scroll positioning
- `selection/selection-layout.web.tsx`: Radix presentation with a browser remap

`intervalDetailComponent` receives `IntervalDetailInput`, the interval input plus absolute
`start`, `end`, and `viewTimezone`; presses still invoke onIntervalPress.
`selectable?: boolean` belongs only to the hook input, `RosterInput`, and defaults to false.
It is excluded from `RosterProps`.
`intervalDetailComponent`, `selectionLayout`, and `portalHost` belong to `RosterProps`
because the chassis mounts the content and layout. The chassis passes
`selectable: Boolean(intervalDetailComponent)` to `useRoster`.
`selectionLayout` defaults once in the chassis and wraps the body
before RosterLayout receives bodyZone. The selection never enters the body content
key. Missing lane/layer/bounds clear selection; valid selections use current data.
Pressing the selected interval again dismisses it; pressing another interval
switches selection. Cell and gap presses dismiss selection while still firing
`onCellPress` and `onGapPress`. These rules live in the hook and apply on native
and web; web outside press and Escape still dismiss.
On web, the layout captures document.activeElement before opening autofocus and
recaptures the focused lane when targetBounds changes while open. It uses onCloseAutoFocus to return focus after Escape only, leaving outside pointer focus intact. The browser's focus-visible ring styling is left to the host page.
`portalHost` defaults to a per-roster useId name. The interval-detail fixture switches
to an inspector column with the same node contract. Schedule does not yet support selection.

The private reconcileSelection helper resolves the stored absolute bounds against the
current lanes and window each render, matching source identity sets and choosing the
nearest bounds with a total difference of at most 1 ms for projection roundoff. Target bounds
include the lane offset and interval inset. Native details clamp horizontally and use the
top edge when neither below nor above fits. The browser gate isolates selection updates from Pressable state,
and separately exercises complete pointer presses and outside dismissal.

Native has no intercepting dismissal overlay; body presses reach the hook, and the detail
card captures its own presses. Web excludes the body wrapper from Radix outside
dismissal, leaving body presses to the hook while preserving true outside presses and Escape.
The hook toggles the selected interval closed, switches to another interval, and dismisses
on cell or gap presses while preserving their callbacks. The body restores horizontal
and vertical offsets from shared values on remount when selectionLayout changes.
A mount effect calls the horizontal ScrollView ref's scrollTo without animation;
native also retains contentOffset. LegendList restores initialScrollOffset through
its own web mount effect and native initial offset.
