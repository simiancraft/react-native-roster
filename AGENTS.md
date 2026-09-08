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

The API is not yet shipped. Issue #1 is the epic; #3 is authoritative for types.
When issues disagree, #3 wins for types and the feature's owning issue wins for
behavior. State any interpretation in the delivery report.

```text
src/
  index.ts                 # public Roster, hook, zone fillers, and core re-exports
  core/index.ts            # pure types, geometry, coverage, caches, and axis helpers
  rrule/index.ts           # recurrence expansion, caps, provenance, and cache API
  components/              # Roster chassis, hook, zones, and rect rows; Schedule planned
  core/*.ts                # pure layout, provenance sweep, and Intl-only zone math
scripts/
  set-version.ts           # release CLI; delegates to the tested manifest writer
  lib/package-version.ts   # validates and rewrites only the package version
test/                      # Bun tests and deterministic fixtures/workload.ts
demo/
  app/_layout.tsx          # Expo Router root
  app/index.tsx            # gallery links and build identity
  app/gallery/             # thin named fixture route shells
  components/gallery-route/ # hook, chassis, controls, and web counter bridge
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
  The only ESLint exception is React Compiler safety over `src/components`;
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
  the framework-required exceptions. No subdirectory barrels except the three
  declared public entry points; a feature's `index.tsx` is its chassis.
- Core imports only standard JavaScript and `Intl`. React, React Native, Expo, and
  `@legendapp/list` are peers. The rrule adapter alone owns Temporal and
  recurrence dependencies; root and core must never import them.
- Work outside the render path: geometry for visible lanes, coverage for every
  lane. Preserve exact provenance by `(kind, id)` and end-exclusive epoch bounds.
  Window is only `{ start, end }`; span and minute step belong to the axis.
- Rule zone interprets adapter-local time; lane zone is a display cue; view zone
  drives the projection. Target-warm means the exact target cache keys exist;
  target-cold means they are absent. Do not restate these as whole-cache states.
- The Expo app is the gallery; a "story" means a fixture route under
  `demo/app/gallery/` using a named fixture from `test/fixtures`. No Storybook.
  Size gates and Playwright arrive in #9; adapter docs and full examples in #10.
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
bun run check:react-compiler  # check React Compiler safety in library components
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
demo web export, tests with coverage, knip, and strict publint. `prepack` builds
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
6. **Roster, the core, and the recurrence adapter are implemented; Schedule is planned.**
   Do not advertise planned surfaces as shipped. Preserve all entry points.
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
    200 lanes separately against 16 ms. Rendering and device gates remain in #9.

11. **Roster waits for viewport measurement before mounting LegendList.** LegendList
    2.x lacks a server snapshot; mounting it during static rendering causes hydration
    recovery. geometryFor calls cached layoutLane for each mounted lane. extraData
    keys window, projection, highlight identity, and rect zone fillers. Vertical scroll
    must not update React state; all lane labels share one translated column.
12. **Reanimated offsets use makeMutable initialized by useState.** The pinned compiler
    lint crashes on useSharedValue's built-in shape. Offsets use get/set and have no
    animations to cancel; the regular compiler gate stays enabled without suppression.
    Reanimated is an optional peer for core-only installs, required by Roster.
13. **Bun tests use a native host preload.** react-test-renderer exercises real hooks;
    native Views, LegendList, and shared values use host doubles. Node export smoke
    tests stub only native peers, then load actual emitted package exports. Browser
    and device integration complement these tests; doubles do not prove native behavior.

14. **Press coordinates differ on web.** press-point.tsx reads native locationX/Y;
    press-point.web.tsx maps DOM clientX/Y relative to currentTarget. Keep the shared
    .types.ts and package.json browser remap together when changing this pair.

15. **Ticks are content-cached arithmetic.** Derive wall steps from day starts and
    transitions, preserving skips and both repeat occurrences. Cache by window bounds,
    timezone, span, minuteStep, and pxPerMinute; identical calls must do no Intl work.
16. **The gallery bridge exposes live functions.** Keep window.__roster stable across
    renders; only on-screen counters sample every 500 ms. Fixture records own zones
    and showsEmptyExample, with visual fillers in test/fixtures/roster-zones.tsx.
17. **Adapter caches retain occurrences only.** Every call nets and applies the total
    cap fresh in rule id order, then date id order. Retained envelopes select bounds
    by containment; only retained per-rule entries guarantee expanded 0. The default
    LRUs retain 2000 occurrence entries and 4 envelopes per set; clear discarded sets
    explicitly. Source identity and notes are attached during assembly.
18. **The pinned recurrence engine needs two compatibility details.** 1.5.2 has a
    CommonJS runtime with ESM declarations; typed require imports in rrule/occurrences.ts
    select matching polyfill instances. Its iterator can replay, so deduplicate local
    dates before cap admission. Supply the implicit monthly day explicitly to avoid
    a 31st drifting through February. Do not move COUNT anchors when skipping history.

19. **Provenance hover is web-only.** interval-hover.tsx attaches nothing on native;
    interval-hover.web.tsx resolves row-relative pointer movement against existing
    geometry. Keep the shared .types.ts and browser remap together. The body key
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
23. Test typechecks resolve the package to source through the `react-native` export condition, so they never depend on `dist`.
