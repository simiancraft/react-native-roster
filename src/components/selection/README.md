# Selection

This feature is about a selection; its children are details.

- `selection-layout.types.ts`: the internal, projection-neutral `SelectionSurfaceProps` contract
- `selection-layout.tsx`: native surface with a local portal host, hardware-back dismissal, and
  detail positioning from shared offsets
- `selection-layout.web.tsx`: web surface with Radix dismissal, focus restoration, collision
  handling, and positioning from shared offsets

The surface accepts resolved `anchorZone` and `contentZone` nodes, selected `targetBounds`, shared
`x` and `y` offsets, open state, dismissal, and a native portal host name. It does not import Roster
or Schedule types. Projection chassis own selection state and adapt their public contracts to this
internal presentation.

Roster keeps its public `SelectionLayoutProps` and `RosterSelectionPopover` under
`../roster/selection`; those files are compatibility adapters. Schedule selection remains a later
change. The native and web files form a platform pair, so keep their `package.json` browser remap.
