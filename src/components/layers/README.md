# layers

This area is about a layer; its children are intervals and gaps. Both
projections draw the same components, so they live above Roster and Schedule.

- Root entry exports: `RosterInterval`, `RosterGap`, `IntervalInput`, `GapInput`
- `layer-stack.tsx`: the shared ordered interval and gap rect collection
- `plot-stack.tsx`: the shared node-only grid, marks, and optional overlay layout; Roster body
  and Schedule day layouts are its consumers
- `layers.types.ts`: the component and collection input contracts both projections pass
- `parts/interval.tsx`, `parts/gap.tsx`: the default components
- `utils/styles.ts`: content-keyed style objects per layer

Internal imports stay within layers and core; the components also import React Native. Tests: `test/components/layers`.

Both projections accept intervalComponent and gapComponent as ComponentType inputs.
Their data-owning lane or column mounts `LayerStack`, which mounts each component with
the final rect, layer, and lane; interval inputs also carry highlighted. Gap pressables
translate local coordinates to plot coordinates. No renderer calls a slot function.

The loaded layers scope retains at most 2,000 style entries shared by both projections,
keyed by layer id and canonical style content. Hits refresh least-recently-used recency.
Loading this scope registers style cleanup with `clearCaches()`; repeated clearing is safe,
and evicted or cleared entries regenerate structurally equal normal and highlighted styles.
