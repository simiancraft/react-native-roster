# selection

This feature is about a selection; its children are details.

The internal `SelectionSurface` is projection-neutral presentation shared by consumers that need
details anchored to selected projection bounds. It accepts mounted anchor and content zones,
content-coordinate `targetBounds`, shared x and y offsets, open and dismissal state, and a native
portal host name. It imports no Roster or Schedule types.

- `selection-layout.types.ts`: the shared presentation-only `SelectionSurfaceProps` contract
- `animated-view.ts`: the shared animated view binding without a CommonJS namespace helper
- `selection-layout.tsx`: native portal, measurement, offset positioning, hardware back, and
  overflow scrolling
- `selection-layout.web.tsx`: Radix portal, translated anchor, outside press, Escape, collision,
  and focus restoration

The surface is internal and has no package entry point. Roster's public `SelectionLayoutProps` and
`RosterSelectionPopover` remain compatibility boundaries under `../roster/selection`; the adapter
maps the existing scroll object to the shared offset pair. Schedule selection remains follow-up
work.

Tests: `test/components/roster/selection-layout.test.tsx`.
