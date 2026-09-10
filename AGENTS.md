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
are reserved for consumers. `availability` and `booking` are contract words in
`LayerRole`; preserve exact contract identifiers from issue #3, including its
coverage fields. Do not introduce consumer-specific entities or dependencies.

## Quick orientation

The implemented surface is documented in README.md and llms.txt. Issue #1 is the epic; #3 is authoritative for types.
When issues disagree, #3 wins for types and the feature's owning issue wins for
behavior. State any interpretation in the delivery report.

```text
src/
  index.ts                 # public Roster, Schedule, hooks, zone fillers, and core re-exports
  core/index.ts            # pure types, geometry, coverage, caches, and axis helpers
  adapters/rrule/index.ts  # the shipped adapter: recurrence expansion, caps, provenance, and cache API
  nativewind/index.ts      # cssInterop registration; className twins for chrome style props
  components/
    roster/                # Roster chassis, hook, layout, and collection parts
    roster/lanes/          # LaneRow, interval hover pair, and lane-local parts
    schedule/              # Schedule chassis, hook, layout, and collection parts
    schedule/days/         # ScheduleDay, day layouts, and day-local parts
    layers/                # interval and gap fillers shared by both projections
    primitives/            # press-point platform pair and regionStyle
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
  components/team-roster/  # the showcase: members, toolbar, and inspector
  app.config.js            # CommonJS config; build identity and Pages base URL
  metro.config.js          # workspace source and single React resolution
.github/                   # CI, Pages, links, Scorecard, and community templates
dist/                      # ignored emitted CommonJS and declarations
AGENTS.md                  # conventions; CLAUDE.md is a symlink here
```

## Conventions

- Bun for installs, scripts, tests, and publishing. Commit Bun's text lockfile;
  CI pins 1.4.0. Node 22 runs Expo tooling, Node export smoke tests, and releases.
- Biome is the only formatter and general linter: two spaces, width 100, single
  quotes, semicolons, trailing commas, organized imports, and Git ignore integration.
  The only ESLint exception is React Compiler safety over `src/components`, `demo/components`,
  and `demo/app`;
  remove it when Biome ships an equivalent rule set.
- TypeScript uses `@typescript/native-preview` (`tsgo`). Editing uses strict ESM
  bundler resolution, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, and Bun
  types. Build uses node16 and rootDir `.` so exports point to `dist/src/`.
- Zone Composer is the house style for `Roster`, `Schedule`, and every gallery
  fixture route. Before drafting a feature, write its two nouns in the issue and
  report: "This feature is about a ___; its children are ___." Roster has lanes;
  schedule has days; a gallery route has fixtures.
- Each feature has a `useXxx` hook owning state and derived values. Its `index.tsx`
  chassis calls the hook, branches flat on `status`, and composes named zones.
  Zone prop names end in `Zone`; every zone prop has a doc comment describing what
  fills it. Layouts only arrange zones. Parts receive domain data, never relayed
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
  is styled through zones, whose fillers accept `className` as plain views.
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
  `TeamRosterScreen` exposes host-facing zones (title, actions, filter, controls,
  corner, lane label, inspector, footer) that default to the showcase parts; the
  route shell owns router contact and passes links in as zones.
  Size gates and Playwright run in `check`; adapter recipes live in docs/adapters.md,
  and shipping one follows docs/adding-an-adapter.md. Each source area has a README
  landing page naming its subpath, exports, boundary, and file map; keep them current.
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

`feat` produces a minor, `fix` a patch, and `!` or `BREAKING CHANGE:` a major.
Demo-scoped commits never release. Commit library changes under a library scope.
Do not publish, tag, change repository settings, or push without task authorization.

## Things that will trip you up

1. **Metro must resolve a single React copy.** Preserve the demo's `resolveRequest`
   pin for React, React DOM, and React Native, plus the upstream NativeWind resolver.
   Pinning NativeWind itself breaks its JSX interop resolution.
2. **The `react-native` export condition selects TypeScript source.** The default
   condition selects real CommonJS in `dist/src`, and types select declarations.
   Enable package exports in Metro; do not alias the library around its exports
   map. Source relative imports have no `.js` suffix. Issue #2 named a `~/` alias,
   but the package uses relative imports because tsgo does not rewrite aliases in
   emitted CommonJS; aliased imports would break Node and publint consumers.
3. **The demo is a Bun workspace.** One root install installs both packages from the root lockfile.
   Keep `demo` in root `workspaces`: Bun then links its `file:..` dependency to the
   root instead of recursively copying the development tree. The demo
   targets SDK 54; do not copy the reference demo's older SDK dependencies.
4. **app.config.js stays CommonJS.** It injects `extra.build.gitSha` and `builtAt`.
   `GITHUB_PAGES` selects `/react-native-roster`; a root URL breaks deployed assets.
5. **Release approval is configured on GitHub.** The `release` environment needs a
   required reviewer before `RELEASE_ENABLED=true`. Approve only against #9 device
   evidence for the exact release commit. See CONTRIBUTING.md for secrets and settings.
   npm authenticates through the trusted publisher registered for `ci.yml` and the
   `release` environment; there is no `NPM_TOKEN`. The job installs npm 11 because
   the OIDC exchange needs 11.5.1 or newer. `@semantic-release/exec` only writes the
   version through `scripts/set-version.ts`; `@semantic-release/npm` publishes and
   verifies the publisher before any release commit or tag is created.
6. **Roster, Schedule, the core, the recurrence adapter, the timezone routes, and
   the provenance routes are implemented.** Preserve all entry points.
7. **Horizontal pointer origin belongs to the window.** The horizontal projection
   has no origin field, so `timeAtX(projection, window, x)` takes the window and
   returns an absolute time.
   Column rect x coordinates reset per column; select it using `rect.column`.
8. **Intl-only zone math lives in core/zone.ts.** It uses explicit Gregorian and
   Latin-digit formatting, `formatToParts`, and UTC Date arithmetic. The Gregorian
   era field preserves years near 0001; h23 plus a modulo-24 normalization handles
   midnight formatting. Hourly probes bracket IANA offset changes, then binary
   search locates exact boundaries. Two offset changes within one probe hour are
   outside this helper's assumption. Hermes formatToParts/device behavior still
   needs device verification; no extra Intl operation or dependency was added.
9. **Cache lifecycle is explicit.** A supplied version must change with layers;
   absent versions use a canonical structural encoding of layers only. Returned
   references are read-only by convention. Clear retained caches when a consumer
   discards old windows. Flag and coverage assembly does not invalidate rects.
10. **Workload W has measured density.** `test/fixtures/workload.ts` emits 70 rects
    plus gap rects per lane per week (63 rects, 7 gap rects), in either projection.
    The test measures target-cold layout of 24 visible lanes and coverage of all
    200 lanes separately against 16 ms everywhere; the 1.5x committed CI runner baseline
    gate runs only when process.env.CI is truthy so hardware classes are comparable.
    Local runs still measure and print both rows. Device gates remain manual.

11. **Roster waits for viewport measurement before mounting LegendList.** LegendList
    2.x lacks a server snapshot; mounting it during static rendering causes hydration
    recovery. geometryFor calls cached layoutLane for each mounted lane. extraData
    keys window, projection, highlight identity, and rect zone fillers. Vertical scroll
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
    when changing this pair. Both projections share it, as they share the interval and
    gap fillers in `components/layers` and the pure `core/hit-test.ts` walk.

15. **Ticks are content-cached arithmetic.** Derive wall steps from day starts and
    transitions, preserving skips and both repeat occurrences. On a cache miss, resolve
    the actual wall minute at each date's first instant; a straddling skip can start
    a date after midnight. Do not add a start-boundary transition delta again.
    Cache by window bounds,
    timezone, span, minuteStep, and pxPerMinute; identical calls must do no Intl work.
16. **The gallery bridge exposes live functions.** Keep window.__roster stable across
    renders; only on-screen counters sample every 500 ms. Fixture records own zones
    and showsEmptyExample, with visual fillers in test/fixtures/roster-zones.tsx.
17. **Adapter caches retain occurrences only.** Every call nets and applies the total
    cap fresh in rule id order, then date id order. Retained envelopes select bounds
    by containment; only retained per-rule entries guarantee expanded 0. The default
    LRUs retain 2000 occurrence entries and 4 envelopes shared across sets; clear discarded windows
    explicitly. Source identity and notes are attached during assembly.
18. **The pinned recurrence engine needs compatibility handling.** 1.5.2 has a
    CommonJS runtime with ESM declarations; typed require imports in rrule/occurrences.ts
    select matching polyfill instances. Its iterator can replay, so deduplicate local
    dates before COUNT or cap admission. Drive the engine in UTC calendar space using
    authored PlainDate and PlainTime fields for date-only or local-datetime DTSTART,
    without resolving skipped dates or hours. Only explicit-offset DTSTART resolves
    as an instant to wall fields and its own offset in the rule's zone. Interpret
    those wall fields as UTC, so a wholly skipped date cannot become another weekday.
    Do not pass COUNT to the engine; drop nonexistent dates before counting existing
    dates from the original anchor.
    Supply the implicit monthly day explicitly to avoid a 31st drifting through
    February. Only interval-1 rules without COUNT and with an exactly local-midnight
    anchor may skip periods. Compute candidates in plain
    date space, retaining the weekly weekday and monthly day, and step back past
    nonexistent dates. All other rules retain the original anchor.
    Every rule enumerates from the period containing DTSTART at the anchor wall time,
    aligned to WKST for WEEKLY and day 1 for MONTHLY, so interval phases follow the
    DTSTART period rather than the first matching date. Dates before DTSTART are
    rejected before COUNT and cap admission.
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
    by day, WKST week, or year-month before deduplication, UNTIL, COUNT, and cap admission.
    Positional enumeration includes complete edge periods, then rejects dates before
    DTSTART and spans outside the envelope. The engine iteration limit is the number
    of authored periods from the enumeration anchor through the query bound, so empty
    candidate periods terminate completely without an arbitrary cutoff. Only that
    exact engine limit error signals completed enumeration; other failures propagate.
    Replayed iterator passes stop before buffering positional candidates.
    YEARLY is unsupported and rejected by input validation.

19. **Provenance hover is web-only.** `roster/lanes/interval-hover.tsx` attaches nothing
    on native; `interval-hover.web.tsx` resolves row-relative pointer movement against
    existing geometry. Keep the shared .types.ts and browser remap together. The body key
    includes hover callback identity and incompleteLabel so mounted rows update.
20. **Provenance fixtures include real expansion.** highlight-rule and
    incomplete-expansion expand in the gallery hook and expose expandStats through
    the stable counter bridge. Sort tests warm only the target mounted lanes;
    sorting itself never lays out offscreen lanes. Incomplete row notices occupy
    the first empty span and leave interval bounds untouched.
21. **Sorting retains the viewport offset, not a lane anchor.** RosterBody disables
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
    Skipped dates have a zero-width header marker supplied by skippedDateZone and
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
    skippedDateZone, transitionZone, and nowLineZone as well as the ordinary slots.

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
