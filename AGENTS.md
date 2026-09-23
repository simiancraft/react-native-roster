# react-native-roster: Agent instructions

## Vocabulary (canonical; code speaks only these words)

| Term | Meaning |
| --- | --- |
| roster | The whole read surface: a shared time axis, lanes, and layers. |
| lane | One person or resource row containing layers, a label, and optional metadata. |
| layer | A named, ordered set of intervals and gaps with a role, z-order, and style. |
| interval | Covered absolute time, `[start, end)` in epoch milliseconds, with sources. |
| gap | Removed absolute time with sources; survives complete subtraction. |
| source | Provenance identified by `(kind, id)`; its label is display metadata. |
| window | A bare absolute `{ start, end }` span; resolution belongs to the axis. |
| projection | Geometry mapping: horizontal for a roster, columns for a schedule. |
| adapter | A function outside the core that converts upstream data into lanes and layers. |
| schedule | One lane projected into days across and wall-clock hours down. |

Use these domain words without synonyms. `scheduler`, `event`, and `calendar`
are reserved for consumers. Searcher vocabulary such as `scheduler` and `calendar`
may appear in npm keywords, the npm description, and README comparisons; keep code
identifiers, API names, and the vocabulary table canonical. `availability` and
`booking` are contract words in `LayerRole`; preserve exact contract identifiers from issue #3, including its
coverage fields. Do not introduce consumer-specific entities or dependencies.

## Quick orientation

The package provides resource timeline and schedule components for React Native and
web, with layered intervals, coverage, provenance, and explicit daylight-saving handling.
README.md is the consumer quick start; llms.txt starts with published-package setup.
Detailed slot tables, selection lifecycle, and the consumer context recipe live in
[customization](docs/customization.md); interval helpers live in the core README.
The recurrence packages install as ordinary dependencies; only `/rrule` imports them.

The implemented surface is documented in README.md and llms.txt. Issue #1 is the epic; #3 is authoritative for types.
When issues disagree, #3 wins for types and the feature's owning issue wins for
behavior. State any interpretation in the delivery report.

```text
src/
  index.ts                 # public Roster, Schedule, hooks, slot components, and core re-exports
  core/index.ts            # pure types, geometry, coverage, caches, and axis helpers
  adapters/rrule/index.ts  # the shipped adapter: recurrence expansion, caps, provenance, and cache API
  nativewind/index.ts      # cssInterop registration; className twins for chrome style props
  components/
    roster/                # Roster chassis, hook, layout, and collection parts
    roster/selection/      # native/web selection layouts and shared presentation contract
    roster/lanes/          # LaneRow, interval hover pair, and lane-local parts
    schedule/              # Schedule chassis, hook, layout, and collection parts
    schedule/days/         # ScheduleDay, day layouts, and day-local parts
    layers/                # shared LayerStack collection, PlotStack layout, and rect components
    primitives/            # portal store, press-point platform pair, and regionStyle
  core/*.ts                # pure layout, hit-test, provenance sweep, and Intl-only zone math
scripts/
  set-version.ts           # release CLI; delegates to the tested manifest writer
  lib/package-version.ts   # validates and rewrites only the package version
test/                      # mirrors src: core, components/{roster,schedule}, adapters/rrule,
                           # plus integration, demo, package, scripts, performance, support, fixtures
demo/
  app/_layout.tsx          # Expo Router root
  app/index.tsx            # home route shell; owns gallery URLs
  app/gallery/             # thin named roster and schedule fixture route shells
  components/gallery/      # the gallery: home/ and fixtures/{roster,schedule}
  components/team-roster/  # the showcase: members, attendance, toolbar, and inspector
  components/ui/           # demo-only Card, Eyebrow, Toggle, and class utilities; no barrel
  components/site-footer/  # project links and the Simiancraft credit on every demo page
  components/theme/        # the scheme toggle and its stored choice
  app.config.js            # CommonJS config; build identity and Pages base URL
  metro.config.js          # workspace source and single React resolution
.github/                   # CI, Pages, links, Scorecard, and community templates
dist/                      # ignored emitted CommonJS and declarations
AGENTS.md                  # conventions; CLAUDE.md is a symlink here
```

## Conventions

- Bun for installs, scripts, tests, and publishing. Commit Bun's text lockfile;
  CI pins 1.4.2. Node 22 runs Expo tooling, Node export smoke tests, and releases.
- Biome is the only formatter and general linter: two spaces, width 100, single
  quotes, semicolons, trailing commas, organized imports, and Git ignore integration.
  The only ESLint exception is React Compiler safety over `src/components`, `demo/components`,
  and `demo/app`;
  remove it when Biome ships an equivalent rule set.
- TypeScript uses `@typescript/native-preview` (`tsgo`). Editing uses strict ESM
  bundler resolution, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, and Bun
  types. Build uses node16 and rootDir `.` so exports point to `dist/src/`.
- [Zone Composer](https://github.com/simiancraft/simiancraft-skills/blob/main/skills/zone-composer/SKILL.md) is the house style for `Roster`, `Schedule`, and every gallery
  fixture route. Before drafting a feature, write its two nouns in the issue and
  report: "This feature is about a ___; its children are ___." Roster has lanes;
  schedule has days; a gallery route has fixtures.
- Each feature has a `useXxx` hook owning state and derived values. Its `index.tsx`
  chassis calls the hook, branches flat on `status`, and composes named zones.
  Node prop names end in `Zone` and accept `ReactNode`; input-bearing slots end in
  `Component` and accept `ComponentType<XxxInput>`. Default and bind component types
  once in the chassis; parts mount them as JSX with their own data, never call them.
  Every zone and component prop has a doc comment describing what fills it.
  Layouts only arrange nodes. Parts receive domain data, never relayed
  flags such as `disabled` or `loading`. Primitives without hooks use plain composition.
- No `useMemo`, `useCallback`, or `React.memo`; consumers use React Compiler.
  The SDK 54 demo enables `experiments.reactCompiler: true` in app.config.js.
  Use `useEffect` only for genuine lifecycle integration. Compute derived values
  during render and handle user actions in handlers.
- Use function declarations for exports, `import type`, kebab-case filenames,
  `useXxx` hook names, and relative imports within `src`. Do not add `.js`
  extensions to source imports.
- Named exports only; Expo Router's route files and tool configuration files are
  the framework-required exceptions. No subdirectory barrels except the four
  declared public entry points; a feature's `index.tsx` is its chassis.
- Core imports only standard JavaScript and `Intl`. React, React Native, Expo, and
  `@legendapp/list` are peers. Adapters live under `src/adapters/<name>`; each
  is its own entry point and imports only core, never components or another
  adapter. `src/adapters` itself has no barrel. The rrule adapter alone owns
  Temporal and recurrence dependencies; root and core must never import them. Only
  `src/nativewind` imports the optional `nativewind` peer; it is the package's
  one side-effect module and is listed in `sideEffects`.
- Chrome regions expose `xxxStyle` props with `xxxClassName` twins declared on
  root props; the nativewind entry maps each twin with `cssInterop`. Layouts
  compose region styles with `regionStyle(structure, paint, override)`, which
  drops the default paint when the override carries a class entry. Fine detail
  is styled through slot components, which accept `className` as plain views.
- Work outside the render path: geometry for visible lanes, coverage for every
  lane. Preserve exact provenance by `(kind, id)` and end-exclusive epoch bounds.
  Window is only `{ start, end }`; span and minute step belong to the axis.
- Rule zone interprets adapter-local time; lane zone is a display cue; view zone
  drives the projection. Target-warm means the exact target cache keys exist;
  target-cold means they are absent. Do not restate these as whole-cache states.
- The Expo app is the gallery; a "story" means a fixture route under
  `demo/app/gallery/` using a named fixture from `test/fixtures`. No Storybook.
  `demo/app/showcase.tsx` is the one non-fixture route; its `team-roster`
  feature generates people with seeded Faker and styles everything with NativeWind
  semantic tokens (`bg-background`, `text-muted-foreground`, `border-border`, and the
  `grid` pair) declared in `demo/global.css` and swapped by the `dark` root class.
  `TeamRosterScreen` exposes host-facing component slots (title, actions, filter, controls,
  corner, lane label, inspector, and footer) that default to the showcase parts; the
  route shell owns router contact and passes links in as zones.
  Generated events carry attendance with expected, pending, present, attended, or
  absent presence states. A fixed seeded clock separates past, live, and future
  events; the toolbar displays now, and present spans extend through now without
  exposing a future departure. Seeded arrival and departure facts stay immutable; late
  departures remain present after scheduled end. Member-local dates drive nonoverlapping
  events. Skipped authored starts produce no event, repeated starts and ends use the earlier
  occurrence, skipped ends clamp to the first instant after the skipped span, and empty or
  negative results are omitted. This wall-time policy is local to the showcase. Union strips
  preserve gaps, and the inspector expands its full week independently.
  Time-off presentation uses the complete gap source set in both projections: an exact singleton
  lunch rule is partial, an exact singleton PTO date is whole-day, and unknown, absent,
  identity-mismatched, or mixed sources are neutral. Width controls label visibility only.
  Event attendance detail lives in the selection popover;
  the inspector retains member selection.
  Inspector day header and cell presses set the roster anchor date in the view timezone.
  Showcase span controls are explicitly `Day` and `Week`; their reset labels are `Demo day` and
  `Demo week`. Compact date labels use month names, and cross-year ranges name both years. Week
  mode alone offers `Detailed` and `Fitted`. Detailed keeps the scrollable 42-pixel-per-hour axis
  and repeats compact date context after each day boundary's bare first time neighbor. Fitted uses
  measured plot width after the people column divided by actual elapsed week minutes, including
  167-hour and 169-hour DST weeks. Day mode retains its fixed, time-only axis. These are demo
  choices and do not alter the library's `Roster` API or fitting semantics.
  Size gates and Playwright run in `check`; adapter recipes live in docs/adapters.md,
  and shipping one follows docs/adding-an-adapter.md. Each area has a README landing
  page naming its subpath, exports, boundary, and file map; keep them current:
  [core](src/core/README.md), [roster](src/components/roster/README.md),
  [schedule](src/components/schedule/README.md), [layers](src/components/layers/README.md),
  [primitives](src/components/primitives/README.md), [rrule](src/adapters/rrule/README.md),
  [nativewind](src/nativewind/README.md), [gallery](demo/components/gallery/README.md),
  [team-roster](demo/components/team-roster/README.md), [site-footer](demo/components/site-footer/README.md),
  and [theme](demo/components/theme/README.md).
- Shared demo visuals use direct file imports from `demo/components/ui`; do not add a barrel.
  `Card` owns `default`, `inset`, and `dashed` surface tones through `contentZone`, and `Eyebrow`
  owns `default` and `compact` caption typography. Declare variants with `cva` and literal,
  scanner-visible utility classes; compose conditional or caller-supplied classes with `cn` from
  `ui/utils/classes`. `Toggle` is only for persistent `pressed` controls or exclusive `radio`
  choices. Keep ordinary actions as buttons without selected, pressed, radio, or checked state.
  Put exclusive choices in a programmatically labeled `radiogroup`; expose checked state on its
  radios. These primitives are demo-only and are never package exports.
- Keep `coverageThreshold = 1.0`. Build before export tests; missing emitted files
  must fail. Tests, demo output, and the subprocess-tested release CLI shim are
  outside coverage; the version writer is covered. Do not commit a red tree.
- Keep README, llms.txt, and these instructions current in the same change.
  Never use em dashes in prose, comments, docs, or issues. Use semicolons for
  independent clauses and the Oxford comma for lists of three or more.

## Common commands

```sh
bun install                   # install root and demo dependencies from the workspace
bun run check                 # run the full local gate before review
bun run clean                 # remove emitted library output
bun run build                 # clean and emit CommonJS, declarations, and source maps with tsgo
bun run lint                  # check formatting, imports, and general lint with Biome
bun run lint:fix              # apply Biome fixes
bun run format                # format files with Biome
bun run typecheck             # check library types with tsgo
bun run typecheck:test        # check library, test, and maintenance-script types with tsgo
bun run typecheck:demo        # check demo types with tsgo
bun run check:react-compiler  # check React Compiler safety in library and demo components
bun run check:knip            # find unused library code and dependencies
bun run check:package         # validate package exports and metadata with strict publint
bun run test                  # run Bun tests with coverage; build first for export tests
bun run build:web             # build the library and export the demo as a static web site
bun run demo                  # start the Expo Router demo
bun run demo:ios              # start the demo on iOS
bun run demo:android          # start the demo on Android
bun run demo:web              # start the demo on web
bun pm pack --dry-run         # inspect the files that would ship
```

`check` runs lint, all three typechecks, React Compiler lint, library build,
demo web export, tests with coverage, knip, strict publint, size-limit, and Playwright. `prepack` builds
from a clean dist. `prepare` installs lefthook. The other names mirror package.json.

## Commits

Conventional Commits, imperative subjects, facts-only bodies usually under eight
lines, and no named section headers. Scopes: `core`, `rrule`, `render`, `axis`,
`schedule`, `demo`, `docs`, `perf`, or none; dependency changes use `chore(deps)`.
Authorship is for humans only. Never credit an assistant as a contributor or
co-author; human co-authors must be explicitly named by the user.

For unscoped commits and every non-demo scope, `!` subjects or `BREAKING CHANGE:`
footers release a major; otherwise, `feat` releases a minor, and `fix`, `perf`,
`refactor`, `revert`, `build`, `docs`, `chore(deps)`, and `chore(deps-dev)` release a
patch. Other `chore` scopes, unscoped `chore`, `style`, `test`, and `ci` do not
release. Any `demo` scope never releases, including breaking commits.
Commit library changes under a library scope.
Do not publish, tag, change repository settings, or push without task authorization.

## Things that will trip you up

1. **Metro must resolve a single React copy.** Preserve the demo's `resolveRequest`
   pin for React, React DOM, and React Native, plus the upstream NativeWind resolver.
   Pinning NativeWind itself breaks its JSX interop resolution.
2. **The `react-native` export condition selects TypeScript source.** The demo adds
   this condition only for the root, core, rrule, and nativewind entry points on
   web, iOS, and Android. Source edits need no `dist` rebuild; restart Metro if it
   does not detect one. The default condition selects real CommonJS in `dist/src`,
   and types select declarations. Enable package exports in Metro; do not alias the
   library around its exports map or change conditions for peers and unrelated
   packages. Source relative imports have no `.js` suffix. Issue #2 named a `~/` alias,
   but the package uses relative imports because tsgo does not rewrite aliases in
   emitted CommonJS; aliased imports would break Node and publint consumers.
3. **The demo is a Bun workspace.** One root install installs both packages from the root lockfile.
   Keep `demo` in root `workspaces`: Bun then links its `file:..` dependency to the
   root instead of recursively copying the development tree. The demo
   targets SDK 54; do not copy the reference demo's older SDK dependencies.
4. **app.config.js stays CommonJS.** It injects `extra.build.gitSha` and `builtAt`.
   `GITHUB_PAGES` selects `/react-native-roster`; a root URL breaks deployed assets.
5. **Merging into main is the release.** The release job runs unattended on every
   push to `main` while `RELEASE_ENABLED=true`; there is no GitHub environment or
   required reviewer, matching the other simiancraft packages. Device evidence for
   #9 belongs on the pull request before it merges. See CONTRIBUTING.md for secrets.
   npm authenticates through the trusted publisher registered for `ci.yml` with no
   environment; there is no `NPM_TOKEN`. The job installs npm 11 because
   the OIDC exchange needs 11.5.1 or newer. `@semantic-release/exec` only writes the
   version through `scripts/set-version.ts`; `@semantic-release/npm` publishes and
   verifies the publisher before any release commit or tag is created.
6. **Roster, Schedule, the core, the recurrence adapter, the timezone routes, and
   the provenance routes are implemented.** Preserve all entry points.
7. **Horizontal pointer origin belongs to the window.** The horizontal projection
   has no origin field, so `timeAtX(projection, window, x)` takes the window and
   returns an absolute time. Its inverse `xAtTime(projection, window, time)`
   supplies horizontal rect and now-line positions.
   Column rect x coordinates reset per column; select it using `rect.column`.
8. **Intl-only zone math lives in core/zone.ts.** It uses explicit Gregorian and
   Latin-digit formatting, `formatToParts`, and UTC Date arithmetic. The Gregorian
   era field preserves years near 0001; h23 plus a modulo-24 normalization handles
   midnight formatting. Hourly probes bracket IANA offset changes, then binary
   search locates exact boundaries. Two offset changes within one probe hour are
   outside this helper's assumption. Hermes formatToParts/device behavior still
   needs device verification; no extra Intl operation or dependency was added.
9. **Cache lifecycle is explicit.** `ScopedCacheIdentity` is a stable empty object whose
   reference identifies one dataset. Omitted core identities share the core-owned default;
   independent datasets use distinct identities, while one dataset reuses its identity across
   geometry and coverage calls and projections. Each Roster or useRoster instance owns an isolated
   identity by default; its optional cacheIdentity deliberately shares one dataset across surfaces.
   Roster passes the resolved identity through coverage, geometry, press hit-testing, and selection
   reconciliation. A supplied version must change with layers;
   absent versions use a canonical structural encoding of layers only. Returned
   references are read-only by convention. Clear retained caches when a consumer
   discards old windows. Each identity retains at most 2,000 least-recently-used layout entries
   and 2,000 least-recently-used coverage entries; hits refresh recency. `clearCaches()` clears
   geometry and every registered cache scope whose module has loaded without resetting counters.
   The loaded roster scope retains 2,000 least-recently-used tick entries, refreshes recency on
   hits, and registers tick cleanup with `clearCaches()`.
   The loaded layers scope retains at most 2,000 least-recently-used style entries shared by both
   projections; hits refresh recency, and complete clearing releases them.
   Core shares least-recently-used maps for 2,000 day columns, 2,000 date starts, and 100 timezone
   formatters; cached null day columns are hits, and the complete clear call releases all three.
   Loading the recurrence entry point registers its occurrence and envelope cleanup;
   `clearCaches()` and `clearExpandCache()` clear the same recurrence entries, remain repeatable,
   and preserve expansion counters without making core import the adapter.
   Flag and coverage assembly does not invalidate rects.
   Each mounted Schedule or useSchedule surface owns an isolated identity by default; pass one
   explicit identity only when multiple surfaces render the same dataset.
10. **Workload W has measured density.** `test/fixtures/workload.ts` emits 70 total rects
    per lane per week (63 interval rects and 7 gap rects), in either projection.
    After five JIT warmups, the test reports the minimum of 31 target-cold samples for
    layout of 24 visible lanes and coverage of all 200 lanes. Both rows gate against
    16 ms everywhere; the 2.0x committed CI runner baseline gate runs only when
    process.env.CI is truthy so hardware classes are comparable. The timing line prints
    the larger current-to-baseline ratio as diagnostic calibration, but assertions use
    only raw milliseconds. Shared-runner regressions below roughly 2x may escape the
    relative gate. Local runs still measure and print both rows. Device gates remain manual.

11. **Roster waits for viewport measurement before mounting LegendList.** RosterBody
    composes a node-only RosterBodyLayout and the RosterLaneList collection part.
    RosterBodyLayout passes gridZone, listZone, and optional overlayZone to the shared
    PlotStack inside horizontal scroll content; PlotStack mounts the overlay wrapper only
    for a provided node. BodyInput extends positive LaneListInput with ticks, grid, and now-line
    inputs; RosterBody picks the lane-list props explicitly. Controlled now defaults
    to null; useRoster retains raw now and derives nowLine ({ x, now }) via xAtTime with the fitted
    projection; nowLine is null when now is null or outside end-exclusive window bounds.
    RosterNowLine fills the overlay through nowLineComponent. Keep now, nowLine, and
    nowLineComponent out of RosterLaneList, LaneRow, and the body content key. LegendList
    2.x lacks a server snapshot; mounting it during static rendering causes hydration
    recovery. geometryFor calls cached layoutLane for each mounted lane. extraData
    keys window, projection, highlight identity, and interval, gap, and incomplete component
    identities. Vertical scroll
    must not update React state; all lane labels share one translated column.
    Roster and Schedule retain a stable press function that reads current inputs
    from a ref; inline consumer callbacks must not enter the body content key.
12. **Reanimated offsets use makeMutable initialized by useState.** The pinned compiler
    lint crashes on useSharedValue's built-in shape. Offsets use get/set and have no
    animations to cancel; the regular compiler gate stays enabled without suppression.
    Reanimated is an optional peer for core-only installs, required by Roster.
13. **Bun tests use a native host preload (`test/support/native-host.ts`).** react-test-renderer exercises real hooks;
    native Views, LegendList, and shared values use host doubles. Node export smoke
    tests stub only native peers, then load actual emitted package exports. Browser
    and device integration complement these tests; doubles do not prove native behavior.

14. **Press coordinates differ on web.** `components/primitives/press-point.tsx` reads
    native locationX/Y; `press-point.web.tsx` maps DOM clientX/Y relative to
    currentTarget. Keep the shared .types.ts and package.json browser remap together
    when changing this pair. Both projections share it, as they share the `LayerStack`, interval,
    and gap components in `components/layers` and the pure `core/hit-test.ts` walk. `LaneRow`
    retains its incomplete component, hover behavior, and row press outside `LayerStack`.

15. **Ticks are content-cached arithmetic.** Derive wall steps from day starts and
    transitions, preserving skips and both repeat occurrences. On a cache miss, resolve
    the actual wall minute at each date's first instant; a straddling skip can start
    a date after midnight. Do not add a start-boundary transition delta again.
    Cache by window bounds,
    timezone, span, minuteStep, and pxPerMinute; identical calls must do no Intl work.
16. **The gallery bridge exposes live functions.** Keep window.__roster stable across
    renders; only on-screen counters sample every 500 ms. Fixture records own zones,
    showsEmptyExample, and showsNowToggle, with visual components in
    test/fixtures/roster-zones.tsx.
17. **Adapter caches retain occurrences only.** Every call nets and applies the total
    cap fresh in rule id order, then date id order. Retained envelopes select bounds
    by containment; only retained per-rule entries guarantee expanded 0. The default
    LRUs retain 2000 occurrence entries and 4 envelopes shared across sets; clear discarded windows
    explicitly. Source identity and notes are attached during assembly.
18. **The pinned recurrence engine needs compatibility handling.** 1.6.0 is an ES module
    package whose require condition serves a CommonJS build and whose one declaration set
    is typed against temporal-spec; typed require imports in rrule/occurrences.ts
    select matching polyfill instances, and temporal-spec stays a dev-only type
    dependency because no emitted declaration references it. Its iterator can replay, so deduplicate local
    dates before COUNT or cap admission. Drive the engine in UTC calendar space using
    authored PlainDate and PlainTime fields for date-only or local-datetime DTSTART,
    without resolving skipped dates or hours. Only explicit-offset DTSTART resolves
    as an instant to wall fields and its own offset in the rule's zone. Interpret
    those wall fields as UTC, so a wholly skipped date cannot become another weekday.
    Do not pass COUNT to the engine; drop nonexistent dates before counting existing
    dates from the original anchor.
    Supply the implicit monthly day and yearly month and day explicitly to avoid a
    31st drifting through February or February 29 drifting through non-leap years.
    Only interval-1 rules without COUNT and with an exactly local-midnight
    anchor may skip periods. Compute candidates in plain
    date space, retaining the weekly weekday, monthly day, or yearly month and day, and step back past
    nonexistent dates. All other rules retain the original anchor.
    Every rule enumerates from the period containing DTSTART at the anchor wall time,
    aligned to WKST for WEEKLY, day 1 for MONTHLY, and January 1 for YEARLY, so interval phases follow the
    DTSTART period rather than the first matching date. Dates before DTSTART are
    rejected before COUNT and cap admission.
    BYYEARDAY and BYWEEKNO are valid only for YEARLY rules; pass them to the recurrence engine
    without applying the implicit yearly month and day.
    DAILY weekday filters are applied by the adapter to the authored daily sequence
    because the engine otherwise re-anchors at the first matching date.
    The engine uses the end of UNTIL's local date as a conservative UTC enumeration bound.
    Explicit-offset UNTIL uses the end of the following local date instead; exact instant
    admission is its only UNTIL admission test. Clamp either bound to the corresponding
    UTC calendar bound of the envelope query.
    The enumeration bound is conservative through the wall date after any cross-date rollback
    at the envelope end, and envelope clipping discards the extra candidates. Before cap admission,
    compare each emitted date at the authored anchor's wall time against local
    datetime UNTIL in plain date-time space, without normalizing skipped hours.
    Only explicit-offset UNTIL compares exact instants, preferring an explicit-offset
    DTSTART's original offset in repeats and using compatible disambiguation otherwise.
    Anchor advancement preserves plain fields; instant comparisons retain the original
    offset. A datetime UNTIL before the original DTSTART admits nothing. Date-only
    UNTIL compares PlainDates, so a skipped final hour or wholly skipped date never
    admits a later local date.
    This preserves results across anchor paths and retained envelopes. Skip
    out-of-envelope occurrences without consuming the cap.
    The adapter owns BYSETPOS after every other BYxxx filter, grouping plain dates
    by day, WKST week, year-month, or year before deduplication, UNTIL, COUNT, and cap admission.
    Positional enumeration includes complete edge periods, then rejects dates before
    DTSTART and spans outside the envelope. The engine iteration limit is the number
    of authored periods from the enumeration anchor through the query bound, so empty
    candidate periods terminate completely without an arbitrary cutoff. Only that
    exact engine limit error signals completed enumeration; other failures propagate.
    Replayed iterator passes stop before buffering positional candidates.
    BYHOUR selects unique integer local hours from 0 through 23 and emits one span per
    contiguous run. Explicit hour bounds contain every selected hour and clip the final
    run; absent bounds derive the band. COUNT counts admitted dates, while occurrence caps
    count emitted spans. Compatible boundary resolution drops skipped runs and omits both
    repeats of an unselected repeated hour.

19. **Provenance hover is web-only.** `roster/lanes/interval-hover.tsx` attaches nothing
    on native; `interval-hover.web.tsx` resolves row-relative pointer movement against
    existing geometry. Keep the shared .types.ts and browser remap together. The body key
    includes hover callback identity and incompleteLabel so mounted rows update.
20. **Provenance fixtures include real expansion.** highlight-rule and
    incomplete-expansion expand in the gallery hook and expose expandStats through
    the stable counter bridge. Sort tests warm only the target mounted lanes;
    sorting itself never lays out offscreen lanes. Incomplete row notices occupy
    the first empty span and leave interval bounds untouched.
21. **Sorting retains the viewport offset, not a lane anchor.** RosterLaneList disables
    LegendList maintainVisibleContentPosition. The pinned 2.x anchoring otherwise
    moves mounted containers outside the viewport on repeated coverage sorts.
22. **Timezone gallery fixtures expand at the selected window.** `test/fixtures/timezones.ts`
    owns the DST and three-zone rule lanes. Fixture records optionally supply ruleLanes,
    windowSpec, windowPresets, and pxPerMinute. Keep root/core isolated from the adapter.
    Pass the gallery's adapter into expandLanes so the bridge reads the same cache instance.
    The gallery bridge exposes real expansion counters; expanded counts computations.
    Lane badges retain IANA names. Coverage excludes projection, so equal absolute
    bounds reuse coverage even when the view zone changes.
23. **Test and demo typechecks pin all four package entry points to source with paths.**
    tsgo selects `types` before the `react-native` custom condition when emitted
    declarations exist. Keep the explicit paths in tsconfig.test.json and
    demo/tsconfig.json, plus customConditions; stale dist must never mask source exports.
    app.config.js disables Metro tsconfigPaths so these type-only mappings do not
    bypass package export conditions during bundling.

24. **Schedule measures before layout.** Its internal width context preserves the
    exact useSchedule contract while fitting day columns to the viewport. Standalone
    hooks use a 280 px grid; the chassis subtracts the 48 px gutter from measured width.
    pxPerHour defaults to 48 and must be a positive finite number. Presses resolve timeAtY and snapToStep before the shared hit-test
    walk, filtering rects by column and keeping the original pointer for final bounds.
    ScheduleDayLayout mounts the shared PlotStack with clipped day bounds. Its overlay keeps the
    window band, transitions, and current-time line in that order at chromeZ above every rect.
    onDayPress receives the actual DayColumn for ordinary dates. ScheduleDayHeaderInput gives custom
    dayHeaderComponent implementations that day and a bound optional onPress handler. The default
    header renders an actionable button only when the handler exists; omission stays presentational,
    and wholly skipped dates mount only skippedDateComponent with no day action.
    Schedule now is controlled and defaults to null; omitted and null values hide the line.
    Hosts that need a live line own now state, update it from their own interval, and clear that
    interval on cleanup. Consumers migrating from the former automatic clock must supply now.
    bandWindow is an optional absolute Window projected as translucent scale pieces into real day
    columns. It does not change the displayed window, lane geometry, coverage, layers, sources,
    press identity, or press behavior. Omitted and invalid intersections draw nothing.
    windowBandComponent replaces each piece and defaults to the root-exported ScheduleWindowBand.
    Its root-exported WindowBandInput carries the real day, zero-based column, clipped absolute
    start and end, and final x, y, width, and height. Declare replacements at module scope and pass
    them with `<Schedule bandWindow={{ start, end }} windowBandComponent={FocusWindowBand} />`.
    Skipped dates have a zero-width header marker supplied by skippedDateComponent and
    ScheduleSkippedDate, never a fabricated day column.
    Schedule fixtures live in test/fixtures/schedule.ts; their routes reuse the counter
    bridge and supply the actual adapter expanded counter.
25. **Performance gates require an exported demo and Chromium.** `check` exports first,
    then runs `check:size` and `check:web`. Install Chromium once with
    `bunx playwright install chromium`; CI includes system dependencies. Traces
    live in `.cache/web-performance/`. `bench:update` writes only the baseline
    JSON; use --machine, --layout, and --coverage to record a green main CI run,
    then commit with its run URL. Baseline increases need measurement evidence and review.
26. **The 200-lane route supplies real expansion to W.** A daily rule and dated
    include clip the selected week's fixture. Default UTC layers retain exact W
    density. The cold-layout capture button times 24 lanes after clearing caches.
    The web view-zone budget uses the actual mounted range, including LegendList's
    boundary guard, in a 24-row viewport. Supply `estimatedListSize` from the
    measured roster viewport to avoid allocating lanes for the whole screen.
27. **Production web Profiler callbacks are disabled.** `check:web` also creates a
    development export and measures actual LegendList LaneRow commits through
    the 200-lane route's profiled body and RosterBody.onRowRender observer. Mount and
    highlight controls must fire; continuously mounted lanes must record zero
    updates on the second scroll pass. The host test remains complementary.
    Follow `docs/performance.md` for native profiles and exact-commit release evidence.

28. **Gallery completeness is fixture-driven.** The home page lists roster and schedule
    fixture records; every record needs a matching thin route shell. Axis fixtures
    cover day/week/month at 15/30/60 minutes. Adapter fixtures supply ruleSet and
    optional expandOptions; useRuleSetDraft owns JSON text, parsing, and the last
    applied set. Apply validates via the actual adapter before updating the roster.
    FixtureLayout places ruleSetEditorZone beside subjectZone, or above it
    on narrow screens. The schedule
    every-zone fixture offers defaults/replacements and date presets to exercise
    skippedDateComponent, transitionComponent, and nowLineComponent as well as the ordinary slots.

29. **Cross-date rollbacks retain absolute column spans.** A local date's column
    spans the first instant of that date to the first instant of the next.
    Instants of an earlier wall-clock date inside that span draw at the top edge
    as repeated time. Compress the surviving repeat span into the region from
    y=0 to where ordinary wall time resumes; timeAtY uses that same scale to
    recover the absolute occurrence. Schedule transition dividerY uses this same
    scale at the transition instant, rather than halving the repeat height.
    This covers St_Johns 2009 and Goose_Bay 1988.
    Select columns by their absolute overlap even when a window ends during the rollback.
30. **Empty roster windows have no body.** A wholly skipped day retains zero
    contentWidth and a finite projection. Positive windows use their exact elapsed
    duration, including sub-minute spans. Cell presses clamp a floor below start
    to start and reject any snapped time at or beyond end in both hooks. timeAtY
    clamps inverse rounding below each scale piece's exclusive end. Adapter input
    validation also runs for empty windows, without enumerating occurrences.

31. **Skipped wall spans belong to the date they interrupt.** Column transitions
    include both boundary instants; the absolute column span stays end-exclusive.
    Schedule clips each transition to the date's wall bands, so an end-boundary
    skip hatches the interrupted date, such as Nuuk 2024-03-30 from 23:00 to 24:00.
    Boundary transitions with no wall-band overlap draw no hatch; timeAtY returns
    null inside the skipped band, and onCellPress must not fire. Wholly skipped
    dates still have no column.

32. **Whole-day overrides use first instants.** When both hours are absent, use
    the first instant of the authored date and the first instant of the following
    date. Compatible midnight resolution can overshoot a straddling skip.
    Wholly skipped dates remain empty; explicit hours retain compatible resolution.

33. **React Native Web renders object styles inline, so inline paint beats any class.**
    `StyleSheet.create` does not change that on 0.21. Chrome regions therefore
    pass `regionStyle(structure, paint, override)`; a NativeWind class entry
    (`$$css`) in the override drops the region's default paint. Native resolves
    classes into style objects, so the outcome matches: the class wins. Metro
    serves library source to the web demo through the `react-native` condition;
    `bun run build` is not needed to see library edits there, but in this
    environment the dev server has needed a restart to notice edits.

34. **Roster selection has a per-instance native portal host.** useRoster owns selection
    and dismissal, refreshing current rect/layer/lane references and clearing missing bounds.
    Pressing the selected interval again dismisses it; pressing another interval
    switches selection. Cell and gap presses dismiss selection while still firing
    `onCellPress` and `onGapPress`. These rules live in the hook and apply on native
    and web; web outside press and Escape still dismiss.
    RosterInput.selectable defaults to false for hook consumers. intervalDetailComponent,
    selectionLayout, and portalHost live on RosterProps; the chassis passes
    selectable: Boolean(intervalDetailComponent) to useRoster.
    The chassis defaults selectionLayout once and passes mounted body and detail nodes.
    targetBounds names the selected bounds; anchorZone holds the mounted body.
    Layout scroll inputs contain only x, y, headerStyle, and labelStyle.
    The default native layout owns PortalHost, named from the roster's useId unless
    portalHost overrides it; independent rosters must use different names. Do not mount
    duplicate hosts. Custom layouts targeting an ancestor host leave ownership there.
    Portal uses an external Map store and does not preserve caller context automatically.
    Target bounds include the lane offset and rect.y inset. The private reconcileSelection helper
    matches source identity sets and chooses nearest bounds with a total difference of at
    most 1 ms for projection roundoff. The native detail card
    uses measured viewport and content sizes to clamp horizontally and falls back to top zero
    when neither below nor above fits. It follows shared offsets with Animated.View, never scroll state.
    Native has no intercepting dismissal overlay; body presses reach the hook, and the detail
    card captures its own presses. Web excludes the body wrapper from Radix outside
    dismissal, leaving body presses to the hook while preserving true outside presses and Escape.
    Web recaptures the focused lane when selection switches and returns focus only after Escape.
    The hook toggles the selected interval closed, switches to another interval, and dismisses
    on cell or gap presses while preserving their callbacks. The body restores horizontal
    and vertical offsets from shared values on remount when selectionLayout changes.
    A mount effect calls the horizontal ScrollView ref's scrollTo without animation;
    native also retains contentOffset. LegendList restores initialScrollOffset through
    its own web mount effect and native initial offset.
    Keep selection out of the body content key. selection-layout.web.tsx imports Radix
    unconditionally. Its peer is optional for native and core-only imports, but required
    by web root and nativewind imports even with selection disabled. The layout uses
    a zero-size pointer-transparent anchor; preserve its package.json browser
    remap and selection-layout.types.ts. Schedule selection is a later change.

    Root and core entry points bind aliases to the existing immutable function declarations,
    preserving identity while avoiding CommonJS re-export getter overhead. The web layout
    composes the shared header and label translations so its Animated import needs no namespace helper.

    use-roster-press.ts isolates the stable press ref. The compiler skips that ref integration
    but compiles useRoster's derived values, so selection does not regenerate lane list data.
    The demo resolver explicitly selects the library's react-native export condition, including
    web, so Metro compiles source hooks rather than emitted CommonJS. Preserve peer resolution.
    The development detail fixture dispatches the click callback to verify zero selection-driven
    mounted-row updates, separately from Pressable's hover, focus, and pressed-state commits.
    The production case retains a complete pointer click.

35. **Showcase attendance belongs to generated events.** This feature is about an
    event; its children are attendances. The events/ chassis exports EventDetail.
    Event contracts live in events/event.types.ts and helpers in events/utils/attendance.ts.
    EventLayout arranges headerZone, chartZone, and footerZone. The chart shares one
    shaded scheduled band and hourly ticks (half-hourly below three hours), with compact names
    above 10px tone-colored bars and 4px row gaps. Future rows use hairlines. Pending
    has a hollow dot, absent a cross, and present a steady filled dot; attended has none.
    The model owns percentage band, tick, and bar geometry, glyphs with emphasis, and detail text.
    Present rows require arrival < now for actual bars, matching actualWindows.
    The footer status line defaults to the attendance legend and scheduled-band explanation.
    events/use-active-attendance.ts owns the active row independently of roster selection.
    Attendances receives activation and deactivation handlers, never the hook return.
    The chassis selects AttendanceLegend or ActiveAttendance for footerZone;
    the legend subject is keyed by event status. Web hover
    or focus matching :focus-visible shows that row's name and detail in the footer;
    keyboard focus wins when both interactions are active. Hover-out and blur end only
    their own interaction. Programmatic focus without :focus-visible does not activate detail.
    Native taps toggle detail or switch to another row; only native rows expose the button role.
    Changing the selected event resets interaction through the chassis event id key.
    EventLayout receives the status node
    through footerZone and only arranges nodes. There is no floating tooltip.
    The hook owns a fixed seeded now and passes it once in lane metadata for portal-safe
    slots, never on each event. Seeded arrival and departure facts do not depend on now.
    Present attendees remain present through scheduled end until their actual departure;
    owners are never absent. Member-local dates and authored daytime hours drive event
    generation across zones and DST. Clip layer intervals to the view window. One layer
    merges overlapping intervals, so generated member events never overlap and lookup
    requires the exact singleton source set. unionOf supplies disjoint bottom strips;
    extentOf supplies the shared detail scale, retaining overhang. The inspector expands
    its own week lane in the hook and uses a Schedule interval without a horizontal strip.
    Retain lanes by team identity, window bounds, and now across selection changes, and
    omit explicit versions so layer content controls geometry cache validity. Default
    component props through destructuring, including explicit undefined. Mount dispatched
    component types as JSX. The root layout is screen-layout.tsx. The inspector retains
    member selection; event detail belongs to the popover. All generated identities and
    the organization are fictional.

36. **Translated roster chrome uses focus-safe web clips.** The header strip and lane-label
    column use `overflow: clip` on web so browser focus scrolling cannot offset translated
    content independently of the roster body. Native retains `overflow: hidden`. The browser
    remap selects the focus-safe-clip platform pair; keep both files and the package mapping
    together. The browser gate focuses clipped label and header content, then verifies alignment
    after wheel scrolling. The label-wheel platform pair forwards vertical web wheel deltas
    (pixels, lines, or pages) from the translated label column to the existing lane list;
    native behavior is unchanged. Only list scroll events update the shared label translation,
    never React state.
37. **Every interval and gap has an accessible target.** LayerStack mounts the platform
    IntervalTarget pair around visual fillers. Names include lane and layer meaning, absolute
    bounds with UTC offsets in the view zone, and source labels with ID fallbacks. Roster and
    Schedule hooks supply projection-specific bounds and stable direct activation callbacks.
    Real pointer presses retain coordinate hit-testing; Enter, Space, and screen-reader actions
    activate the exact rect, including lower overlapping layers and repeated-hour pieces.
    Lane and day coordinate targets stay outside keyboard navigation. Targets use no per-rect
    React state. Native Roster details receive accessibility focus and restore a still-mounted
    origin after dismissal; web restores the exact target only after Escape. Schedule callback
    activation leaves focus on its target because Schedule has no built-in detail surface. Keep
    the interval-target browser remap, its shared types, and package.json together.
