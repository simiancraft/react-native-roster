# core

Pure types and geometry. Imports only standard JavaScript and `Intl`; no React,
no React Native, no dependencies.

- Public subpath: `react-native-roster/core`; the root entry re-exports it
- Authoritative types: `types.ts` (`Lane`, `Layer`, `Interval`, `Gap`,
  `Source`, `Window`, `Projection`, `Rect`, `Coverage`, `LaneGeometry`)
- Interval helpers: `extentOf(segments: readonly Window[]): Window | null`,
  `intersectionOf(spans: readonly Window[]): Window | null`, and
  `unionOf(spans: readonly Window[]): Window[]`
- Barrel: `index.ts` only

| File | Role |
| --- | --- |
| `axis.ts` | window specs, spans, and navigation (`windowFor`, `next`, `prev`, `today`) |
| `layout.ts` | rect geometry for one lane in either projection |
| `coverage.ts` | covered and removed minutes per lane |
| `source.ts` | `hasSource(sources, source)` matches kind and id, ignoring labels |
| `spans.ts` | `extentOf`, `intersectionOf`, `unionOf`, and the provenance sweep with exact sources per merged span |
| `columns.ts` | day columns, transitions, and skipped dates for the columns projection |
| `zone.ts` | Intl-only timezone math (offsets, first instants, transitions) |
| `scale.ts`, `snap.ts` | pixel and time conversion (`xAtTime`, `timeAtX`, `timeAtY`), pointer snapping |
| `hit-test.ts` | the geometry walk both hooks use to resolve a press |
| `order.ts`, `flag.ts` | lane comparators and lane flags |
| `cache.ts`, `hash.ts` | layout and coverage caches keyed by lane content |

All interval helpers reuse the bare `{ start, end }` `Window` type with
end-exclusive epoch millisecond bounds. `extentOf` bridges disjoint segments;
`intersectionOf` returns only their shared span. Both return `null` for empty
input; an empty intersection, including touching bounds, also returns `null`.
`unionOf` merges overlapping or touching windows, sorts by start, and keeps
disjoint windows separate. It returns `[]` for empty input and new window objects.
Every input must have finite bounds and `end > start`; otherwise the helpers throw `RangeError`.
Inputs may be unsorted, overlapping, nested, or duplicated; inputs are not mutated.
The existing `Span` type names axis choices only.

Reference: [design](../../docs/design.md), [timezones](../../docs/timezones.md),
[caches](../../docs/caches.md). Tests: `test/core`.

The public entry binds immutable function aliases directly to preserve implementation
identity while avoiding repeated CommonJS getter wrappers in consumer bundles.
