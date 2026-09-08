# Contributing to react-native-roster

## Prerequisites and setup

Use Bun 1.4.0 and Node 22. Native demo testing also requires a compatible device
or simulator and the platform toolchain. The demo targets Expo SDK 54.

```sh
git clone https://github.com/simiancraft/react-native-roster.git
cd react-native-roster
bun install
bun run check
```

The root workspace lockfile is committed. Run `bun install --frozen-lockfile` at the
root to install both the package and demo, matching CI. The prepare hook installs lefthook; pre-commit formats staged
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
`src/components`. Read [AGENTS.md](./AGENTS.md) for vocabulary, Zone Composer,
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
Other maintenance commits do not release by default.

## Releases

Release automation is dormant until `RELEASE_ENABLED=true`, `APP_ID`,
`APP_PRIVATE_KEY`, and `NPM_TOKEN` are configured. Configure the GitHub `release`
environment with a **required reviewer before enabling releases**. The reviewer
must verify issue #9's device fps and layout evidence, including screenshots on
the pull request for the exact commit being released, before approving the job.
The YAML references the environment; required reviewers are a repository setting.

Semantic release updates the manifest with `bun scripts/set-version.ts`, publishes
with `bun publish --access public`, updates the changelog, and creates the release
through the GitHub App token. `NPM_CONFIG_TOKEN` supplies Bun's registry credential.
Pages requires GitHub Actions as the site's build source. Neither repository
settings nor deployment have been verified by the local bootstrap.

## Community

Use the [issue templates](https://github.com/simiancraft/react-native-roster/issues/new/choose)
for bugs and feature requests. Report security issues privately through
[SECURITY.md](./SECURITY.md). Participation follows the
[Contributor Covenant 2.1](./CODE_OF_CONDUCT.md).
