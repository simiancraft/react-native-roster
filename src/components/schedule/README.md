# Schedule

This feature is about a schedule; its children are days.

- Root entry exports: `Schedule`, `useSchedule`, the `ScheduleXxx` parts, and
  every `ScheduleXxxInput` slot input type from `schedule.types.ts`

- `index.tsx`: the chassis; measures the viewport, calls `useSchedule`, composes zones
- `use-schedule.ts`, `use-schedule-viewport.ts`: the hook and the width context
- `layout.tsx`: arranges header, gutter, and days regions only
- `schedule.types.ts`: props, model, and every slot input type
- `parts/`: collection-level parts (gutter, incomplete)
- `days/`: `ScheduleDay`, the day and day-header layouts, and `ScheduleColumn`; the day layout
  mounts the shared PlotStack, and the column mounts the shared LayerStack
- `utils/days.ts`: header dates, now position, and transition bounds
- `utils/window-band.ts`: absolute-window clipping and scale-piece projection

Interval and gap components live in `../layers`; press geometry and `regionStyle`
in `../primitives`. Zone contracts and a complete example live in the
[customization guide](../../../docs/customization.md#schedule-zones) and `llms.txt`. Tests: `test/components/schedule`.

`ScheduleColumn` and Roster's `LaneRow` use the same ordered interval and gap collection.
The hook supplies each target's exact absolute column bounds, including both repeated-hour
occurrences. Keyboard and screen-reader actions invoke the exact interval or gap callback and keep
focus on the target because Schedule has no built-in detail surface. Pointer presses retain the
day's coordinate hit-test path.

The chassis binds default component types once; ScheduleDay mounts components
with day data and passes nodes into ScheduleDayLayout. ScheduleDayLayout supplies its grid,
column, and ordered window-band, transition, and now-line overlay to PlotStack. There is no
black-box day list to split: days, transitions, and rects already map in their owning parts.
Schedule has eleven input-bearing component slots and no zero-argument singleton slots.

`now` is controlled and defaults to null. Omitting it or passing null hides the line. Supply epoch
milliseconds to show a fixed instant. Schedule owns no timer; a live-clock host keeps `now` in
state, updates it from an interval, and clears that interval on cleanup. Consumers migrating from
the former automatic line must supply `now` and own its updates.

`bandWindow` optionally projects an absolute `Window` as translucent pieces through the real day
columns. Omitted, empty, reversed, and nonoverlapping values produce no pieces. Derivation stays
outside lane layout and cache keys, so changing the band preserves the displayed window, geometry,
coverage, layers, sources, and press behavior. `windowBandComponent` receives the root-exported
`WindowBandInput` for every visible piece. The input contains the real `day`, zero-based `column`,
clipped absolute `start` and `end`, and final `x`, `y`, `width`, and `height`.
`ScheduleWindowBand` is the root-exported translucent default. A replacement is supplied as
`<Schedule bandWindow={{ start, end }} windowBandComponent={FocusWindowBand} {...props} />`, with
`FocusWindowBand` declared at module scope and typed with `WindowBandInput`.

`onDayPress` receives the actual `DayColumn` for an ordinary activated heading. The root-exported
`ScheduleDayHeaderInput` gives a custom `dayHeaderComponent` the `day` and an optional `onPress`
already bound to it. The default `ScheduleDayHeader` renders an actionable button only when the
handler exists; without `onDayPress`, it stays presentational and does not add an inert button.
Wholly skipped local dates mount `skippedDateComponent` instead, with no synthetic day or action.

Each mounted `Schedule` or `useSchedule` surface owns an isolated `ScopedCacheIdentity` by default.
Pass one stable `cacheIdentity` to multiple surfaces only when they render the same dataset and
should share target-warm geometry and coverage.
