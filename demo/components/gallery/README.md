# gallery

This feature is about a gallery; its children are fixtures.

- `home/`: the landing page; `GalleryHomeScreen` lists fixture records and takes
  the route shell's `showcaseHref`, `fixtureHref`, and `linkComponent`
- `fixtures/`: what every fixture route shares: `FixtureLayout`, the `Control`
  and counters parts, and the counter-bridge platform trio
- `fixtures/roster/`: `RosterFixtureScreen`, `useRosterFixture`, the rule-set
  draft and editor, and the profiled body
- `fixtures/schedule/`: `ScheduleFixtureScreen`, `useScheduleFixture`, and its controls

Fixture records live in `test/fixtures`; each needs a thin route shell under
`demo/app/gallery`. Tests: `test/demo`.

The roster every-zone fixture offers a now-line toggle at the selected window
midpoint. The record declares `showsNowToggle`; the chassis supplies `nowZone`
to the controls. Its hook owns the control state and computes the selected window
once; the roster receives the controlled instant.
