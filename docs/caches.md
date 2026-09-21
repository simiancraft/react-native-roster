# Caches and counters

Layout runs for mounted lanes; coverage runs for all lanes before sorting.
Geometry keys include lane id, version (or a structural encoding of layers),
window, and every projection field. Coverage keys omit projection. Bump a
supplied `lane.version` whenever layers change. Labels, lane timezone, flags,
completeness, and metadata do not invalidate rects. Treat returned references
as read-only.

Each dataset identity retains at most 2,000 layout entries and 2,000 coverage
entries. Both maps use least-recently-used eviction; a hit refreshes recency.
Eviction changes only retention, so requesting an evicted input recomputes an
equal result.

`clearLayoutCache()` and `clearCoverageCache()` release their corresponding
geometry entries. `clearCaches()` releases both, then clears every other cache
scope that has registered after its module was loaded. Registration does not
make core import components, adapters, React, or recurrence dependencies. All
three clear calls are repeatable and preserve counters. `layoutStats()` and
`coverageStats()` return `{ runs, cacheHits }`; `resetStats()` resets both
without clearing caches.

The recurrence adapter keeps its own caches. `expandStats()` returns
`{ rules, dates, expanded, cacheHits, cacheMisses }`; `resetExpandStats()`
resets those counters, and `clearExpandCache()` clears occurrence and envelope
caches. One shared LRU retains four envelopes across sets by default;
containment selects the most recently used matching envelope, including after
a rule edit. The default LRUs retain 2000 occurrence entries.

Target-warm means the exact target keys exist; target-cold means they are
absent. A retained envelope alone does not guarantee retained occurrence
entries.
