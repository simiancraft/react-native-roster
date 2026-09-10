# core

Pure types and geometry. Imports only standard JavaScript and `Intl`; no React,
no React Native, no dependencies.

- Public subpath: `react-native-roster/core`; the root entry re-exports it
- Authoritative types: `types.ts` (`Lane`, `Layer`, `Interval`, `Gap`,
  `Source`, `Window`, `Projection`, `Rect`, `Coverage`, `LaneGeometry`)
- Barrel: `index.ts` only

| File | Role |
| --- | --- |
| `axis.ts` | window specs, spans, and navigation (`windowFor`, `next`, `prev`, `today`) |
| `layout.ts` | rect geometry for one lane in either projection |
| `coverage.ts` | covered and removed minutes per lane |
| `spans.ts` | the provenance sweep: exact sources per merged span |
| `columns.ts` | day columns, transitions, and skipped dates for the columns projection |
| `zone.ts` | Intl-only timezone math (offsets, first instants, transitions) |
| `scale.ts`, `snap.ts` | pixel and time conversion, pointer snapping |
| `hit-test.ts` | the geometry walk both hooks use to resolve a press |
| `order.ts`, `flag.ts` | lane comparators and lane flags |
| `cache.ts`, `hash.ts` | layout and coverage caches keyed by lane content |

Reference: [design](../../docs/design.md), [timezones](../../docs/timezones.md),
[caches](../../docs/caches.md). Tests: `test/core`.
