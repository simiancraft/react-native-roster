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

The roster `interval-detail` record and thin route reuse the fixture chrome.
`test/fixtures/roster-zones.tsx` supplies details (lane, layer, view-zone
bounds, and sources) and an inspector selection layout. useRosterFixture owns the
popover/inspector toggle; the chassis binds selectionLayout and intervalDetailComponent.
The view timezone provider sits above the native host, so details retain it through
the portal store. Schedule does not yet support selection.

Metro selects the library's declared react-native source condition on web as well,
so React Compiler retains the roster body inputs across selection changes. The
development detail fixture profiles opening details alongside the existing scroll gate.

## Run the gallery and explore fixtures

The [Expo gallery](https://simiancraft.github.io/react-native-roster/) is the
demo; there is no Storybook. Run it locally with `bun install --frozen-lockfile`,
`bun run build`, and `bun run demo:web` (add `EXPO_OFFLINE=1` in a restricted
network). The home page lists every fixture route:

- Empty, one, 20, and 200 lanes; inset layers; default and replaced zones.
- Day, week, and month routes at 15, 30, and 60-minute steps.
- Full-day gaps, lane flags, equal-z precedence, highlight, coverage sorting,
  and incomplete expansion.
- Chicago DST weeks, mixed rule, lane, and view zones, and editable adapter routes.
- Schedule empty, layered, excluded, spring, fall, Lord Howe, Apia, incomplete,
  midnight, side-by-side projections, and every zone.

The [showcase](../team-roster/README.md#showcase-tour) demonstrates an integrated screen.
