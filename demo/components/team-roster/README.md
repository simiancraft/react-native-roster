# team-roster

The showcase. This feature is about a team roster; its children are members.

- `index.tsx`: `TeamRosterScreen`; host-facing component slots default to the parts here
- `use-team-roster.ts`: window, filter, sort, zone, density, and selection
- `screen-layout.tsx`, `header-layout.tsx`, `toolbar-layout.tsx`: row and column strategies
- `events/`: `EventDetail`, its layout, heading, axis captions, and attendance rows
- `members/`: `MemberInspector`, `member.types.ts`, and member-local parts
- `parts/`: title, chips, window controls, member label, header cell, grid
  lines, layer fillers, legend, and the generated-data note
- `utils/`: seeded Faker generation, formatting, and NativeWind tone tables

Styled with the semantic tokens in `demo/global.css`; the route shell owns router contact.

Host slots with inputs use ComponentType; backZone is a node. Stable interval,
header-cell, and lane-label components read display settings from context.
The member Schedule uses TeamScheduleInterval and omits the horizontal attendance strip.
Its lane is expanded separately for the full inspector week, including in day mode.
Generated lanes are retained by team identity, window bounds, and now; selection changes
preserve lane objects. Layer content supplies the structural cache version.
Explicit undefined component slots retain their defaults.

## Event attendance

This feature is about an event; its children are attendances, one per expected
attendee. All bounds are epoch milliseconds and end-exclusive.

- `events/index.tsx`: `EventDetail`, the interval detail slot chassis.
- `events/layout.tsx`: heading, axis, and attendances zones.
- `events/parts/heading.tsx`: title, scheduled range, and description.
- `events/parts/axis.tsx`: shared scale and future, live, and past captions.
- `events/parts/attendances.tsx`: named rows selected by presence state.
- `events/event.types.ts`: event, attendance, presence, and immutable fact contracts.
- `events/utils/attendance.ts`: exact source-set lookup, joined attendee rows, presence union
  using `unionOf`, detail extent using `extentOf`, model, and bar offsets.
- `utils/team.ts`: member-local dates, nonoverlapping events, seeded arrival and departure
  facts, and presence states derived from those facts plus now.

The hook owns a fixed seeded clock on January 5, 2026, and starts on that demo day.
The toolbar displays now, and the roster draws the now line at that instant; navigation
returns to the demo day. Future attendees are
expected. Live attendees can be pending, present, or attended. After scheduled end,
late departures remain present until their immutable departure instant; others are
attended or absent. The lane owner is never absent. Present rows run from arrival
through now without exposing a future departure. The interval strip draws one segment
per union window, preserving disjoint gaps and overhang.
A live event with only pending attendees has no strip. Detail rows share the extent
of actual and scheduled time. Source lookup lives in lane metadata, so module-scope
slots work through native portals without inherited context. The member inspector
retains identity, facts, and Schedule; event details live in the popover.

Events are seeded by member identity and authored local date, so day and week views
agree. Resolve authored daytime hours in the member's zone across DST, then clip
layer intervals to the view window while preserving scheduled event bounds for detail.
One layer merges overlapping intervals; generated member events therefore never overlap,
and source lookup accepts only the rect's exact singleton source set.
The hook passes now once in lane metadata for portal-safe slots, never on each event.
All people and the organization are fictional.

## Folder nouns

| Folder | Feature noun | Children noun |
| --- | --- | --- |
| `team-roster/` | team roster | members |
| `parts/` | team roster | regions |
| `utils/` | team roster | members |
| `members/` | member inspector | days |
| `members/parts/` | member inspector | regions |
| `events/` | event | attendances |
| `events/parts/` | event detail | attendance rows |
| `events/utils/` | event | attendances |
