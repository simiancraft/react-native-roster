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

The roster `interval-detail` record and thin route reuse the fixture chrome.
`test/fixtures/roster-zones.tsx` supplies details (lane, layer, view-zone
bounds, and sources) and an inspector selection layout. useRosterFixture owns the
popover/inspector toggle; the chassis binds selectionLayout and intervalDetailComponent.
The view timezone provider sits above the native host, so details retain it through
the portal store. Schedule does not yet support selection.

Metro selects the library's declared react-native source condition on web as well,
so React Compiler retains the roster body inputs across selection changes. The
development detail fixture profiles opening details alongside the existing scroll gate.
