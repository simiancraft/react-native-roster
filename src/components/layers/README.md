# layers

This area is about a layer; its children are intervals and gaps. Both
projections draw the same components, so they live above Roster and Schedule.

- Root entry exports: `RosterInterval`, `RosterGap`, `IntervalInput`, `GapInput`
- `layers.types.ts`: the component input contract both projections pass
- `parts/interval.tsx`, `parts/gap.tsx`: the default components
- `utils/styles.ts`: content-keyed style objects per layer

Internal imports stay within layers and core; the components also import React Native. Tests: `test/components/layers`.

Both projections accept intervalComponent and gapComponent as ComponentType inputs.
Their data-owning lane or column mounts the component with the final rect, layer,
and lane; interval inputs also carry highlighted. No renderer calls a slot function.
