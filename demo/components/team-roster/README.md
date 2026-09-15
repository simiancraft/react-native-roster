# team-roster

The showcase. This feature is about a team roster; its children are members.

- `index.tsx`: `TeamRosterScreen`; host-facing component slots default to the parts here
- `use-team-roster.ts`: window, filter, sort, zone, density, and selection
- `layout.tsx`, `header-layout.tsx`, `toolbar-layout.tsx`: row and column strategies
- `events/`: `EventDetail`, its layout, heading, axis captions, and attendance rows
- `members/`: `MemberInspector`, `member.types.ts`, and member-local parts
- `parts/`: title, chips, window controls, member label, header cell, grid
  lines, layer fillers, legend, and the generated-data note
- `utils/`: seeded Faker generation, formatting, and NativeWind tone tables

Styled with the semantic tokens in `demo/global.css`; the route shell owns router contact.

Host slots with inputs use ComponentType; backZone is a node. Stable interval,
header-cell, and lane-label components read display settings from context.
The member Schedule shares the interval component and timezone context.

## Event attendance

This feature is about an event; its children are attendances, one per expected
attendee. All bounds are epoch milliseconds and end-exclusive.

- `events/index.tsx`: `EventDetail`, the interval detail slot chassis.
- `events/layout.tsx`: heading, axis, and attendances zones.
- `events/parts/heading.tsx`: title, scheduled range, and description.
- `events/parts/axis.tsx`: shared scale and future, live, and past captions.
- `events/parts/attendances.tsx`: named rows selected by presence state.
- `utils/attendance.ts`: source lookup, presence extent using the library
  `extentOf` export, model, and bar offsets.
- `utils/team.ts`: seeded expected attendees and presence states.

The hook owns a fixed seeded clock on January 5, 2026, and starts on that demo day.
The toolbar displays now, and the roster draws the now line at that instant; navigation
returns to the demo day. Future attendees are
expected. Live attendees can be pending, present, or attended. Past attendees are
attended or absent; the lane owner is never absent. Present rows run from arrival
through now without recording a departure. The interval strip spans earliest
arrival through latest departure or now for anyone present, including overhang.
A live event with only pending attendees has no strip. Detail rows share the extent
of actual and scheduled time. Source lookup lives in lane metadata, so module-scope
slots work through native portals without inherited context. The member inspector
retains identity, facts, and Schedule; event details live in the popover.
