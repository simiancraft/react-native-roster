# Caches and counters

Layout runs for mounted lanes; coverage runs for all lanes before sorting.
Geometry keys include lane id, version (or a structural encoding of layers),
window, and every projection field. Coverage keys omit projection. Bump a
supplied `lane.version` whenever layers change. Labels, lane timezone, flags,
completeness, and metadata do not invalidate rects. Treat returned references
as read-only.

## Dataset ownership

Geometry and coverage are retained within a `ScopedCacheIdentity`. The object's
reference is the identity; keep one stable empty object for the lifetime of one
dataset. Two identities isolate datasets even when their lanes have the same ids,
versions, windows, and projections.

Standalone core callers should pass their dataset identity to both functions:

```ts
import type { ScopedCacheIdentity } from 'react-native-roster/core';
import { coverageFor, layoutLane } from 'react-native-roster/core';

const payrollCache: ScopedCacheIdentity = {};
const dispatchCache: ScopedCacheIdentity = {};

const payrollCoverage = coverageFor(payrollLane, window, payrollCache);
const payrollGeometry = layoutLane(payrollLane, window, projection, payrollCache);

// dispatchLane may reuse payrollLane's id and version without colliding.
const dispatchCoverage = coverageFor(dispatchLane, window, dispatchCache);
const dispatchGeometry = layoutLane(dispatchLane, window, projection, dispatchCache);
```

Omitting the identity from a standalone core call uses one core-owned default.
That is convenient for one dataset, but independent datasets should not share it.

Each mounted `Roster`, `Schedule`, `useRoster`, and `useSchedule` surface owns a
stable, isolated identity when `cacheIdentity` is omitted. Independent surfaces
therefore need no extra setup, including when their lane keys collide:

```tsx
import { Roster, Schedule } from 'react-native-roster';

export function IndependentSurfaces() {
  return (
    <>
      <Roster lanes={payrollLanes} windowSpec={windowSpec} />
      <Roster lanes={dispatchLanes} windowSpec={windowSpec} />
      <Schedule lane={payrollLane} windowSpec={scheduleWindowSpec} />
      <Schedule lane={dispatchLane} windowSpec={scheduleWindowSpec} />
    </>
  );
}
```

Supply an identity only to share retained work deliberately. For example, a roster
and schedule that project the same dataset can share one identity:

```tsx
import { Roster, Schedule, type ScopedCacheIdentity } from 'react-native-roster';

const staffCache: ScopedCacheIdentity = {};

export function StaffViews() {
  return (
    <>
      <Roster cacheIdentity={staffCache} lanes={staffLanes} windowSpec={windowSpec} />
      <Schedule
        cacheIdentity={staffCache}
        lane={selectedStaffLane}
        windowSpec={scheduleWindowSpec}
      />
    </>
  );
}
```

Sharing an identity does not make every lookup warm. Target-warm means the exact
target keys exist; target-cold means they are absent. Coverage keys omit projection,
so equal lane content and absolute window bounds can reuse coverage across roster and
schedule projections. Geometry keys include projection fields and warm only for the
same projection.

Each dataset identity retains at most 2,000 layout entries and 2,000 coverage
entries. Both maps use least-recently-used eviction; a hit refreshes recency.
Eviction changes only retention, so requesting an evicted input recomputes an
equal result.

When the roster module is loaded, one shared least-recently-used cache retains at
most 2,000 tick entries. Tick hits refresh recency; eviction and clearing preserve
the generated tick content.

Core also retains up to 2,000 day columns, 2,000 date starts, and 100 timezone formatters across
datasets. These shared maps use least-recently-used eviction; hits, including cached null day
columns for skipped dates, refresh recency. Eviction does not change computed day columns, starts,
offsets, or formatting behavior.

## Clearing and disposal

`clearLayoutCache()` and `clearCoverageCache()` release all retained keys of the
corresponding kind across identities; clear them when a consumer discards old windows.
They do not reset counters. `clearCaches()` releases both, the loaded core day-column, date-start,
and timezone-formatter maps, then every other cache scope that has registered after its module was
loaded. Registration does not make core import components, adapters, React, or recurrence
dependencies. All three clear calls are repeatable. Loading the roster module registers its tick
cache, so
`clearCaches()` also releases retained ticks.
`layoutStats()` and `coverageStats()` return `{ runs, cacheHits }`;
`resetStats()` resets both without clearing caches.

There is no separate identity disposal call. An identity owned by a mounted surface
becomes eligible for collection after that surface unmounts. For an explicit identity,
unmount every surface using it and drop the consumer's reference when the dataset is
discarded. Do not reuse that object for unrelated replacement data. If a long-lived
identity moves through old windows, clear the corresponding caches when those windows
are discarded.

The recurrence adapter keeps its own caches. `expandStats()` returns
`{ rules, dates, expanded, cacheHits, cacheMisses }`; `resetExpandStats()`
resets those counters, and `clearExpandCache()` clears occurrence and envelope
caches. One shared LRU retains four envelopes across sets by default;
containment selects the most recently used matching envelope, including after
a rule edit. The default LRUs retain 2000 occurrence entries.

For recurrence expansion, a retained envelope alone does not guarantee retained
occurrence entries.
