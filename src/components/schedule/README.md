# Schedule

This feature is about a schedule; its children are days.

- Root entry exports: `Schedule`, `useSchedule`, the `ScheduleXxx` parts, and
  every `ScheduleXxxInput` slot input type from `schedule.types.ts`

- `index.tsx`: the chassis; measures the viewport, calls `useSchedule`, composes zones
- `use-schedule.ts`, `use-schedule-viewport.ts`: the hook and the width context
- `layout.tsx`: arranges header, gutter, and days regions only
- `schedule.types.ts`: props, model, and every slot input type
- `parts/`: collection-level parts (gutter, incomplete)
- `days/`: `ScheduleDay`, the day and day-header layouts, and day-local parts
- `utils/days.ts`: header dates, now position, and transition bounds

Interval and gap components live in `../layers`; press geometry and `regionStyle`
in `../primitives`. Zone contracts and a complete example live in the
[customization guide](../../../docs/customization.md#schedule-zones) and `llms.txt`. Tests: `test/components/schedule`.

The chassis binds default component types once; ScheduleDay mounts components
with day data and passes nodes into ScheduleDayLayout. There is no black-box day
list to split: days, transitions, and rects already map in their owning parts.
Schedule has ten input-bearing component slots and no zero-argument singleton slots.
