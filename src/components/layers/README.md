# layers

This area is about a layer; its children are intervals and gaps. Both
projections draw the same components, so they live above Roster and Schedule.

- Root entry exports: `RosterInterval`, `RosterGap`, `IntervalInput`, `GapInput`
- `layer-stack.tsx`: the shared ordered interval and gap rect collection
- `interval-target.tsx` / `interval-target.web.tsx`: native and web accessible rect targets
- `interval-target.types.ts`, `interval-target-label.ts`: shared target contract and names
- `plot-stack.tsx`: the shared node-only grid, marks, and optional overlay layout mounted by
  both the Roster body and Schedule day layouts
- `layers.types.ts`: the component and collection input contracts both projections pass
- `parts/interval.tsx`, `parts/gap.tsx`: the default components
- `utils/paint.ts`, `utils/styles.ts`: shared default plot paint and content-keyed layer styles

Internal imports stay within layers and core; the components also import React Native. Tests: `test/components/layers`.

Both projections accept intervalComponent and gapComponent as ComponentType inputs.
Their data-owning lane or column mounts `LayerStack`, which mounts each component with
the final rect, layer, and lane; interval inputs also carry highlighted. Gap pressables
and interval targets keep pointer coordinates on the shared hit-test path. Keyboard and
screen-reader actions activate the exact rect directly. Target names include lane and layer
meaning, absolute bounds with offsets in the view zone, and source labels with ID fallbacks.
Web uses native buttons and browser focus rings; native uses button accessibility and
screen-reader activation. Neither platform adds per-rect React state. No renderer calls a slot
function.

The loaded layers scope retains at most 2,000 style entries shared by both projections,
keyed by layer id and canonical style content. Hits refresh least-recently-used recency.
Loading this scope registers style cleanup with `clearCaches()`; repeated clearing is safe,
and evicted or cleared entries regenerate structurally equal normal and highlighted styles.
