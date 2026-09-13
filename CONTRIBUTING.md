# Contributing to react-native-roster

## Prerequisites and setup

Use Bun 1.4.0 and Node 22. Native demo testing also requires a compatible device
or simulator and the platform toolchain. The demo targets Expo SDK 54.

```sh
git clone https://github.com/simiancraft/react-native-roster.git
cd react-native-roster
bun install --frozen-lockfile
bun run check
```

The root workspace lockfile is committed; one frozen install at the root installs
both the package and the demo, matching CI. Add `--ignore-scripts` in a sandbox
that cannot run the lefthook install hook. The prepare hook installs lefthook; pre-commit formats staged
files, restages fixes, and checks library types, test types, and React Compiler safety.

## Common tasks

| Task | Command |
| --- | --- |
| Full gate | `bun run check` |
| Lint / fix / format | `bun run lint` / `bun run lint:fix` / `bun run format` |
| Library / tests / demo types | `bun run typecheck` / `bun run typecheck:test` / `bun run typecheck:demo` |
| React Compiler safety | `bun run check:react-compiler` |
| Build library | `bun run build` |
| Build demo web | `bun run build:web` |
| Tests with coverage | `bun run test` (build first for exports tests) |
| Dead code / package hygiene | `bun run check:knip` / `bun run check:package` |
| Inspect release contents | `bun pm pack --dry-run` |
| Start demo | `bun run demo` |
| iOS / Android / web demo | `bun run demo:ios` / `bun run demo:android` / `bun run demo:web` |

Biome owns format and lint. ESLint is limited to React Compiler safety in
`src/components`, `demo/components`, and `demo/app`. Read [AGENTS.md](./AGENTS.md) for vocabulary, Zone Composer,
source exports, and the conventions required by later features.

## Pull requests and commits

Keep each commit green under the check script at that commit. Target `main`,
keep changes focused, test behavior, and update docs with any public API change.
Use Conventional Commits with imperative subjects: `feat(core): add ...`,
`fix(axis): correct ...`, or `chore(demo): add ...`. Bodies contain facts only,
usually fewer than eight lines, with no named headings. Authorship is for humans
only; co-author trailers are reserved for humans explicitly named by the author.
Never use em dashes in prose; use semicolons, commas, or parentheses. Use the Oxford comma.

`feat` releases a minor, `fix` a patch, and `!` or a `BREAKING CHANGE:` footer a
major. Demo-scoped commits never release. Do not scope library changes to `demo`.
Other maintenance commits do not release by default. Merge pull requests with a
merge commit; squashing rewrites the subjects that semantic-release reads.

For a worktree-local browser cache, set `PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/playwright"`
on both the install and check commands. To keep Bun scratch and cache writes local,
set `TMPDIR="$PWD/.cache/tmp"` and `BUN_INSTALL_CACHE_DIR="$PWD/.cache/bun"` after
creating those directories.

## Releases

Release automation is dormant until the repository variable `RELEASE_ENABLED=true`
and the `APP_ID` and `APP_PRIVATE_KEY` secrets are configured. Configure the GitHub
`release` environment with a **required reviewer before enabling releases**. The
reviewer must verify issue #9's device fps and layout evidence, including screenshots
on the pull request for the exact commit being released, before approving the job.
The YAML references the environment; required reviewers are a repository setting.

npm has no token secret. The package's npmjs.com settings register a trusted
publisher for this repository, workflow file `ci.yml`, and environment `release`;
the job exchanges its GitHub OIDC token for a short-lived publish credential. The
job upgrades to npm 11 because the OIDC exchange needs npm 11.5.1 or newer, and
Node 22 bundles npm 10. `@semantic-release/npm` probes that exchange in its verify
step, so a misconfigured publisher fails before any release commit or tag exists.

Semantic release updates the manifest with `bun scripts/set-version.ts`, publishes
through `@semantic-release/npm` with provenance, updates `CHANGELOG.md`, and creates
the GitHub release with generated notes through the GitHub App token. Version
0.0.0 is a placeholder that reserved the name; tag `v0.0.0` on the commit before
the first release so semantic-release starts the series below 1.0.0; fix commits
alone yield 0.0.1 and a feat yields 0.1.0.
Pages requires GitHub Actions as the site's build source.

## Community

Use the [issue templates](https://github.com/simiancraft/react-native-roster/issues/new/choose)
for bugs and feature requests. Report security issues privately through
[SECURITY.md](./SECURITY.md). Participation follows the
[Contributor Covenant 2.1](./CODE_OF_CONDUCT.md).
