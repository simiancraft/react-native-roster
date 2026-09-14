# attendance

This feature is about an attendance; its children are attendees. The plan band
and together block are layers laid across attendees, not children.

Demo-only, using the public `react-native-roster` and core entry points.
`AttendancePanel` composes title, controls, roster, legend, and notice zones;
`AttendanceScreen` arranges three panels and a route-supplied home zone.

- `index.tsx`: panel chassis and flat together/apart branches
- `screen.tsx`: responsive screen with dates formatted from each plan
- `layout.tsx`: the five node zones
- `use-attendance.ts`: independent everyone/anchor state, lane versions, layers,
  and totals from public useRoster coverage
- `attendance.types.ts`: attendance, attendees, modes, statuses, and lane metadata
- `parts/`: title, mode toggle, label, clock header, grid lines, legend, notices, three interval visuals,
  interval dispatch, and detail dispatch
- `utils/`: segment collapse, overlap and dead-time math, status derivation, timezone
  formatting, layer construction, metadata access, coverage totals, and tone tables
- `../../../test/fixtures/attendance.ts`: three fixed cases for fictional Lantern Foundry
- `../../app/attendance.tsx`: the route shell

The custom window includes every presence bar, ten minutes of leading padding,
and 25 minutes of trailing padding for clock labels. Roster
uses 48 px lanes and a minimum 1.5 px per minute, expanding to fit wider panels.
Plan is custom at z 0, presence is availability at z 1 with an 8 px inset, and
together is booking at z 2 with no inset, visually spanning adjacent lanes.
No intersection means no together layer. Anchor mode uses the designated bar
without clipping the common block to other attendees.

Coverage's availabilityMinusBookingMinutes is dead time. Per-attendee together
minutes are availabilityMinutes minus that difference, rather than bookingMinutes,
which measures the whole common block even outside that attendee's presence.
Missed means no overlap with the current together block. Other statuses compare
arrival and departure to the plan. Unordered, overlapping, or disjoint presence
segments collapse to the earliest
arrival and latest departure. Nia steps out and rejoins in the workshop fixture.
An empty segment list is a no-show with missed status and no presence bar.
Fixture ids identify immutable data; lane versions combine the fixture id and mode.

Semantic tokens live in demo/global.css and demo/tailwind.config.js. The
utils/tones.ts table documents every kind, status, together, dead-time, and
caption-ink token.
Clock captions disappear below 84 px; inset dead-time bands disappear below 24 px.
Bands show minute captions at 40 px. Together uses a 5% fill and 2 px accent edges.
Roster height follows lane count, with a 136 px minimum.
Pressing inside the together block shows attendee-in-block detail: the attendee
name, block bounds and facts, arrival, departure, presence minutes, together minutes,
and dead time. Pressing a bar outside the block shows presence detail. The highest
layer wins presses. Details format the public start, end, and viewTimezone inputs and use
lane metadata, so native portal context preservation is unnecessary.

Tests: `test/demo/attendance.test.tsx`, including both modes, disjoint and touching
bounds, coverage, lane version changes, host geometry, and all detail dispatches.
