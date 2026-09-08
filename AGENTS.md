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
  index.ts                 # public React entry; re-exports ./core, otherwise empty
  core/index.ts            # empty pure core entry; types and geometry arrive in #3
  rrule/index.ts           # empty adapter entry; recurrence expansion arrives in #4
  components/              # planned Roster (#5) and Schedule (#11) chassis and zones
  lib/                     # planned pure geometry, axis math, and helpers
scripts/
  set-version.ts           # release CLI; delegates to the tested manifest writer
  lib/package-version.ts   # validates and rewrites only the package version
test/                      # Bun tests; fixture generator arrives in #3
demo/
  app/_layout.tsx          # Expo Router root
  app/index.tsx            # static roster shell and build identity
  app/gallery/             # reserved fixture routes, starting in #5
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
  Use `useEffect` only for genuine lifecycle integration. Compute derived values
  during render and handle user actions in handlers.
- Use function declarations for exports, `import type`, kebab-case filenames,
  `useXxx` hook names, and relative imports within `src`. Do not add `.js`
  extensions to source imports.
- Named exports only; Expo Router's route files and tool configuration files are
  the framework-required exceptions. No subdirectory barrels except the three
  declared public entry points; a feature's `index.tsx` is its chassis.
- Core imports only standard JavaScript and `Intl`. React, React Native, Expo, and
  `@legendapp/list` are peers. The future rrule adapter alone owns Temporal and
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
6. **An empty API is intentional at bootstrap.** Do not advertise planned components
   as shipped. Preserve the three entry points while later issues fill them.
