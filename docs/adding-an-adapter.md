# Adding a shipped adapter

An adapter converts one upstream shape into lanes and layers. The [adapters
guide](./adapters.md) covers writing one inside your app; this page is the
recipe for shipping one in this package, modeled on the rrule adapter.

## The shape

```text
src/adapters/<name>/
  README.md        # subpath, exports, dependency boundary, supported input, file map
  index.ts         # the entry point and the only barrel
  types.ts         # input and result types
  validate.ts      # reject bad input before any work
  ...              # single-purpose files named for what they do
test/adapters/<name>/
```

An adapter imports `../../core` only. It never imports components, the root
entry, or another adapter. Any dependency it needs belongs to it alone and is
listed in `NOTICE.md`; root and core stay dependency-free.

## Steps

1. State the nouns in the issue: "This adapter is about a ___; its children are ___."
2. Create the folder above and write its README first: the public subpath, the
   exports, the boundary, and what input it accepts and rejects.
3. Add the subpath to `package.json` `exports` with `types`, `bun`,
   `react-native`, and `default` conditions matching the rrule entry, and to the
   `paths` in `tsconfig.test.json` and `demo/tsconfig.json`.
4. Add a size gate to `.size-limit.json` and the entry to `test/package/subpath-exports.test.ts`
   expectations if it stubs a native peer.
5. Preserve provenance: every interval and gap carries `(kind, id)` sources, and
   removed time survives complete subtraction as a gap.
6. Report completeness: return `complete: false` with a `truncated` list when a
   cap drops data, and never infer completeness in the renderer.
7. Add fixtures under `test/fixtures` and a gallery route so the home page lists them.
8. Document it: README entry points, `llms.txt`, and the AGENTS.md tree.

Run `bun run check` before opening the pull request.
