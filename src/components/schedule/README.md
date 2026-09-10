# Schedule

This feature is about a schedule; its children are days.

- `index.tsx`: the chassis; measures the viewport, calls `useSchedule`, composes zones
- `use-schedule.ts`, `use-schedule-viewport.ts`: the hook and the width context
- `layout.tsx`: arranges header, gutter, and days regions only
- `schedule.types.ts`: props, model, and every zone input type
- `parts/`: collection-level parts (gutter, incomplete)
- `days/`: `ScheduleDay`, the day and day-header layouts, and day-local parts
- `utils/days.ts`: header dates, now position, and transition bounds

Interval and gap fillers live in `../layers`; press geometry and `regionStyle`
in `../primitives`. Zone contracts are documented in the README's Schedule
section and in `llms.txt`. Tests: `test/components/schedule`.
