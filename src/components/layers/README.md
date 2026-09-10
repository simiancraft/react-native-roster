# layers

This area is about a layer; its children are intervals and gaps. Both
projections draw the same fillers, so they live above Roster and Schedule.

- Root entry exports: `RosterInterval`, `RosterGap`, `IntervalInput`, `GapInput`
- `layers.types.ts`: the filler input contract both projections pass
- `parts/interval.tsx`, `parts/gap.tsx`: the default fillers
- `utils/styles.ts`: content-keyed style objects per layer

Imports core only. Tests: `test/components/layers`.
