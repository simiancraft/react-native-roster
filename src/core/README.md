# core

Pure types and geometry. Imports only standard JavaScript and `Intl`; no React,
no React Native, no dependencies.

- Public subpath: `react-native-roster/core`; the root entry re-exports it
- Authoritative types: `types.ts` (`Lane`, `Layer`, `Interval`, `Gap`,
  `Source`, `Window`, `Projection`, `Rect`, `Coverage`, `LaneGeometry`,
  `ScopedCacheIdentity`)
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

`layoutLane(lane, window, projection, cacheIdentity?)` and
`coverageFor(lane, window, cacheIdentity?)` use a stable `ScopedCacheIdentity` object to keep
retained results within one dataset. Omitted identities use the core-owned default. Standalone
callers should keep one empty identity object for each dataset and pass the same object to both
functions; projections share coverage because projection fields remain outside the coverage key.
Each identity retains at most 2,000 least-recently-used layout entries and 2,000
least-recently-used coverage entries; hits refresh recency. `clearCaches()` clears both geometry
caches, shared least-recently-used maps for 2,000 day columns, 2,000 date starts, and 100 timezone
formatters, and every registered cache scope whose module has loaded, while preserving counters.
Cached null day columns refresh recency like other hits.

```ts
import type { ScopedCacheIdentity } from 'react-native-roster/core';
import { coverageFor, layoutLane } from 'react-native-roster/core';

const cacheIdentity: ScopedCacheIdentity = {};
const coverage = coverageFor(lane, window, cacheIdentity);
const geometry = layoutLane(lane, window, projection, cacheIdentity);
```

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

## Interval helper walkthrough

`unionOf(spans: readonly Window[]): Window[]` merges overlapping or touching
windows and returns them sorted by start, keeping disjoint windows separate.
Empty input returns `[]`. Every returned window is a new object; the input array
and its windows remain untouched. Like `extentOf` and `intersectionOf`, it uses
end-exclusive epoch milliseconds and throws `RangeError` for non-finite bounds
or `end <= start`.

Collapse each person's segments with `extentOf`, then use `intersectionOf` to
find the shared time across those windows. Each extent bridges gaps between
segments, so the result describes the collapsed windows.

```ts
import type { Window } from 'react-native-roster/core';
import { extentOf, intersectionOf } from 'react-native-roster/core';

const people: { name: string; segments: Window[] }[] = [
  {
    name: 'Alex',
    segments: [
      { start: 1_000, end: 3_000 },
      { start: 4_000, end: 8_000 },
    ],
  },
  {
    name: 'Sam',
    segments: [
      { start: 2_000, end: 5_000 },
      { start: 6_000, end: 9_000 },
    ],
  },
];

const windows = people.map((person): Window => {
  const extent = extentOf(person.segments);
  if (extent === null) throw new Error(`${person.name} has no segments`);
  return extent;
});
const sharedTime = intersectionOf(windows); // { start: 2_000, end: 8_000 }
// A null result from intersectionOf means there is no shared time.
```
