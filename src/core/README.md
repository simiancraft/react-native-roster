# core

Pure types and geometry. Imports only standard JavaScript and `Intl`; no React,
no React Native, no dependencies.

- Public subpath: `react-native-roster/core`; the root entry re-exports it
- Authoritative types: `types.ts` (`Lane`, `Layer`, `Interval`, `Gap`,
  `Source`, `Window`, `Projection`, `Rect`, `Coverage`, `LaneGeometry`)
- Interval helpers: `extentOf(segments: readonly Window[]): Window | null` and
  `intersectionOf(spans: readonly Window[]): Window | null`
- Barrel: `index.ts` only

| File | Role |
| --- | --- |
| `axis.ts` | window specs, spans, and navigation (`windowFor`, `next`, `prev`, `today`) |
| `layout.ts` | rect geometry for one lane in either projection |
| `coverage.ts` | covered and removed minutes per lane |
| `spans.ts` | `extentOf`, `intersectionOf`, and the provenance sweep with exact sources per merged span |
| `columns.ts` | day columns, transitions, and skipped dates for the columns projection |
| `zone.ts` | Intl-only timezone math (offsets, first instants, transitions) |
| `scale.ts`, `snap.ts` | pixel and time conversion, pointer snapping |
| `hit-test.ts` | the geometry walk both hooks use to resolve a press |
| `order.ts`, `flag.ts` | lane comparators and lane flags |
| `cache.ts`, `hash.ts` | layout and coverage caches keyed by lane content |

Both interval helpers reuse the bare `{ start, end }` `Window` type with
end-exclusive epoch millisecond bounds. `extentOf` bridges disjoint segments;
`intersectionOf` returns only their shared span. Empty input returns `null`, as
does an empty intersection, including touching bounds. Every input must have
finite bounds and `end > start`; otherwise the helpers throw `RangeError`.
Inputs may be unsorted, overlapping, nested, or duplicated; inputs are not mutated.
The existing `Span` type names axis choices only.

Reference: [design](../../docs/design.md), [timezones](../../docs/timezones.md),
[caches](../../docs/caches.md). Tests: `test/core`.
