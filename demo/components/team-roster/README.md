# team-roster

The showcase. This feature is about a team roster; its children are members.

- `index.tsx`: `TeamRosterScreen` and `TeamRosterSlots`; host-facing slots default to the parts here
- `use-team-roster.ts`: window, filter, sort, zone, density, and selection
- `screen-layout.tsx` and `toolbar-layout.tsx`: row and column strategies
- `header-layout.tsx`: wrapping title and actions arrangement
- `events/`: `EventDetail`, its layout, heading, shared chart, footer, and attendance interactions
- `members/`: `MemberInspector`, `member.types.ts`, and member-local parts
- `parts/`: title, chips, window controls, member label, header cell, grid
  lines, layer fillers, legend, and the generated-data note
- `utils/`: seeded Faker generation, formatting, and NativeWind tone tables

Styled with the semantic tokens in `demo/global.css`; the route shell owns router contact.

The `TeamRosterSlots` type groups component slots with inputs using `ComponentType`
and the `backZone` node. Stable interval,
header-cell, and lane-label components read display settings from context.
The member Schedule uses TeamScheduleInterval and omits the horizontal attendance strip.
Its automatic system-clock now line is suppressed because Schedule has no controlled clock.
Its lane is expanded separately for the full inspector week, including in day mode,
and indexed by member id. Interval presses retain the member with no inspector detail;
gap presses resolve time-off notes from source id suffixes (lunch or pto).
Gap presentation uses the complete source set: an exact singleton authored lunch rule is partial,
and an exact singleton authored PTO date is whole-day. Unknown, absent, identity-mismatched, or
mixed sources stay neutral in both the roster and Schedule; width only hides or shows the
source-derived label.
Generated lanes are retained by team identity, window bounds, and now; selection changes
preserve lane objects. Layer content supplies the structural cache version.
Explicit undefined component slots retain their defaults.
Inspector day header and cell presses set the roster anchor date in the view timezone.

## Event attendance

This feature is about an event; its children are attendances, one per expected
attendee. All bounds are epoch milliseconds and end-exclusive.

- `events/index.tsx`: `EventDetail`, the interval detail slot chassis.
- `events/layout.tsx`: headerZone, chartZone, and footerZone.
- `events/parts/heading.tsx`: title, scheduled range, and description.
- `events/parts/axis.tsx`: start and end labels for the shared scale.
- `events/parts/attendances.tsx`: shared tick lines, one scheduled band, and compact attendance rows.
- `events/parts/footer.tsx`: `AttendanceLegend` and `ActiveAttendance` leaves, selected by the chassis.
- `events/use-active-attendance.ts`: separate hover, keyboard focus, and press state.
- `events/parts/attendance-interaction.ts`, `attendance-interaction.web.ts`, and
  `attendance-interaction.types.ts`: native and web handlers with a shared interaction contract.
- `events/event.types.ts`: event, attendance, presence, and immutable fact contracts.
- `events/utils/attendance.ts`: exact source-set lookup, joined attendee rows, presence union
  using `unionOf`, detail extent using `extentOf`, model, percentage band and bar offsets, wall-clock ticks, glyphs with emphasis, and footer detail text.
- `utils/team.ts`: member-local dates, nonoverlapping events, seeded arrival and departure
  facts, and presence states derived from those facts plus now.

The hook owns a fixed seeded clock on January 5, 2026, and starts on that demo day.
The toolbar displays now, and the roster draws the now line at that instant; navigation
returns to the demo day. Future attendees are
expected. Live attendees can be pending, present, or attended. After scheduled end,
late departures remain present until their immutable departure instant; others are
attended or absent. The lane owner is never absent. Present rows run from arrival
through now without exposing a future departure; arrival exactly at now has no actual bar or strip. The interval strip draws one segment
per union window, preserving disjoint gaps and overhang.
A live event with only pending attendees has no strip. Detail rows share the extent
of actual and scheduled time. One shaded scheduled band sits behind all rows, with
hourly tick lines (half-hourly below three hours) connecting the axis to the last row.
Names sit directly above 10px tone-colored bars, with 4px between rows. Pending uses
a hollow dot, absent a cross, and present a steady filled dot; completed rows have no glyph.
Future rows use hairlines. The popover footer is a status line: by default it explains
actual attendance (expected attendees for future events) and the shaded scheduled band.
The event detail's `useActiveAttendance` hook replaces that legend with the active row's
name and detail sentence during web hover, web focus matching `:focus-visible`, or
native taps. A native tap toggles the row detail; tapping another row switches it.
Keyboard focus wins while hover and focus are both active.
Hover-out and blur end only their own interaction; the legend returns when none remain.
Changing the selected event resets attendance interaction through the event id key. Programmatic focus without `:focus-visible` does not activate detail.
The chart receives activation and deactivation handlers, preserving interaction kind,
instead of the hook return. Native rows expose a button role for their tap action;
web rows retain their descriptive label without a button role.
The footer status node is passed through `footerZone`; the layout only arranges nodes.
No floating tooltip covers attendee names or neighboring rows, and interaction never
changes roster selection. Source lookup lives in lane metadata, so module-scope
slots work through native portals without inherited context. The member inspector
retains identity, facts, and Schedule; event details live in the popover.

Attendance shapes use a deterministic member-id hash, including host-supplied non-numeric ids.
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

## Showcase tour

The [live showcase](https://simiancraft.github.io/react-native-roster/showcase) has twelve generated people across seven zones,
weekly hours and exclusions from the recurrence adapter, booked events, day
and week spans, sorting, filtering, and a per-person Schedule, styled with
NativeWind class props and slot components, with a sun and moon theme toggle.
Names, titles, and the organization come from `@faker-js/faker` with a fixed
seed; any resemblance to real people is coincidental.
Each event compares scheduled time with seeded attendee arrivals and departures.
A fixed seeded now separates past, live, and future events; attendees are expected,
pending, present, attended, or absent. Present spans extend through now without
exposing future departures, including after scheduled end until actual departure.
A bottom strip draws the union of attendances over the lighter scheduled block,
preserving gaps and overhang. The event detail popover shares a shaded scheduled
band across attendance rows. Its footer status line defaults to the attendance
legend and scheduled-band explanation; web hover or visible keyboard focus shows
row detail, and native taps toggle detail or switch rows. The inspector retains
member selection. The file map above locates its implementation.
