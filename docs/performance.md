# Performance evidence

Workload W is `test/fixtures/workload.ts`: seed 1318, 200 lanes, seven days,
two layers, at most 12 intervals per lane per day, and source depth at most 3.
The fixture test records 63 rects and 7 gap rects per lane per week. The cold
layout batch contains 24 lanes; coverage contains all 200. Use 15-minute ticks.

## Automated gates

`bun run check` exports the production and development web demos, runs the Bun benchmarks,
checks the two package sizes, and runs the Playwright harness. CI runs the same
gates on every pull request. Install Chromium once before the local gate:

```sh
bunx playwright install chromium
bun run check
```

For a worktree-local browser cache, use
`PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/playwright"` on both commands. Linux CI
installs browser system dependencies with `bunx playwright install --with-deps chromium`.
`bun run check:web` first runs `bun run build:web:dev` to export `demo/.cache/dev-dist`,
then serves it and the existing production `demo/dist` on a loopback ephemeral port.
It fails if either export or the browser is missing. It never starts a development server.
Failures exit nonzero. Trace and screenshot files live in `.cache/web-performance/`.
Open a trace with `bunx playwright show-trace .cache/web-performance/trace.zip`.

Both timing rows independently fail at 16 ms or above on every machine. Only when
`process.env.CI` is truthy do they also fail above 1.5 times their committed CI
runner value in `test/performance-baseline.json`. Local runs still measure and
print both rows, but skip the relative gate because hardware differs. Five untimed JIT warmup
iterations precede 11 samples; the reported value is their median. Every sample
clears the exact layout and coverage keys before timing. Fixture construction,
cache clearing, and counter reads are outside the timer. Each layout sample
includes geometry assembly's coverage of those 24 lanes; the separate coverage
sample clears coverage again and computes all 200 lanes. A target-cold sample
is not a cold JavaScript runtime. Timing harness code and the baseline CLI are
outside coverage, like the existing release CLI shim; library coverage stays 100%.

`.size-limit.json` bundles both emitted entry points with the small-library
esbuild preset, minifies them, and disables gzip and Brotli. Limits are decimal
15 kB for core and 40 kB for root. React, React Native, Expo, LegendList, and
Reanimated, including their subpaths, remain external. Adapter dependencies are
not externalized to hide an accidental root/core import; export isolation tests
also reject that import graph. Build before running `bun run check:size`.

## Refresh the CI baseline

On a green run of `main` using Bun 1.4.0 on GitHub Actions `ubuntu-latest`, read
both millisecond values from the CI job log line `Workload W target-cold: ...`.
From a clean checkout of that run's commit with the same Bun version, run:

```sh
bun run bench:update --machine "GitHub Actions ubuntu-latest" --layout <ms> --coverage <ms>
```

The supplied numbers are recorded without measuring locally. Set `measuredAt` in
`test/performance-baseline.json` to the CI measurement timestamp; the script records
its invocation time, current commit, runtime, and working tree state. Run the full
gate, then commit the baseline with the CI run URL in the commit message. Include
old and new numbers and the reason in the PR. CI never updates the baseline, and
a failing regression is not permission to raise it.

Without `--layout` and `--coverage`, the script measures locally; `--machine`
defaults to the local OS and CPU description. It always warns that the committed
baseline must come from a CI run. Both timing flags must be supplied together as
positive finite milliseconds.

## Browser action protocol

The 200-lane route starts at the UTC week of 2024-01-01 and 15-minute ticks.
`performance-lanes.ts` clips W through a real shared daily include rule and one
dated include, then moves W to the selected week. With default rule hours, the
original week's layers and rect density equal W exactly; the fixture test proves
this. Changing rule hours truncates the actual displayed intervals. Expansion
supplies rendered lane content, so zero counters cannot pass because the adapter
was disconnected. This is a fixture adapter; it adds no library surface.

The harness sizes the physical viewport to 24 rows and reloads before measuring.
LegendList may mount its boundary guard row as well. The view-zone assertion
counts that actual mounted lane set before any scrolling and requires exactly
one run per mounted lane, with a bound of 24 to 26 mounted lanes. It does not
compare layout runs against all 200 lanes or against a number inferred from
counters. This is the mounted-lane interpretation of issue #9's visible lane count.
The timed Bun and device batches still contain exactly 24 lanes.

It calls all three cache clears, then forces fixture assembly with a lane-zone
edit and proves two expansion misses. Each measured action resets counters
without clearing caches. The assertions are:

| Action | Expansion computations | Layout runs | Coverage runs |
| --- | ---: | ---: | ---: |
| View zone UTC to Chicago, before scroll | 0 | Mounted lane count | 200 |
| Scroll the same range a second time | 0 | 0 | Not budgeted |
| Lane selection | 0 | 0 | Not budgeted |
| Fresh-source highlight | 0 | 0 | Not budgeted |
| Coverage sort, after visiting its target | 0 | 0 | Not budgeted |
| Unrelated last lane zone | 0 | 0 | Not budgeted |
| Rule hours 24 to 10 | 1 | Not budgeted | Not budgeted |
| Next week outside retained envelopes | Rules + dates, here 2 | Not budgeted | Not budgeted |
| Previous week inside retained envelope | 0 | Not budgeted | Not budgeted |

Expansion hits must equal calls (rules plus dates) minus computations on every
row. Scroll verifies actual scroll offsets. It warms by traversing the same range,
and warms sort by selecting its target and returning. No helper precomputes all
200 lane geometries. W has equal weekly coverage across lanes, so the coverage
sort's tie order can equal label order. The sort action still changes the selected
comparator and assembles coverage. Distinct coverage ordering is covered by the
existing provenance tests and sort-coverage fixture.

The zone change reanchors the same local week, changing absolute bounds, so all
200 coverage keys are absent. Equal absolute bounds would reuse coverage under
issue #3 and are not this test. Returning to UTC before the rule edit preserves
exact per-rule envelope keys for the unchanged date. The first retained envelope
is January 1 minus 48 hours through January 8 plus 48 hours. The Chicago week is
inside it. January 8 through January 15 extends beyond it, so Next creates a new
envelope; Previous must reuse the first. The sequence never visits next week
before that assertion. The adapter's default four-envelope LRU retains both.

## LaneRow render evidence

The production export disables React Profiler callbacks, so its cache and action
assertions run separately from the development render gate. `build:web:dev` uses
Expo's `--dev` export; only the development 200-lane route supplies a profiled body.
The body's optional `onRowRender` observer enables a Profiler around each real LegendList LaneRow, and
`window.__roster.profileStats()` exposes detached body and per-lane commit counts.
The production gallery supplies no observer.

The browser gate requires nonzero body and LaneRow mount counts, warms the scroll
range, then traverses the same six offsets again. It intersects the mounted lane
ids at every offset and asserts unchanged mount and update counts for every
continuously mounted lane, with at least eight such lanes required. A subsequent
highlight must produce a recorded LaneRow update, proving the instrumentation
can detect changes. Entering and leaving lanes may mount and unmount. Production
action budgets remain in the same harness, and both exports must have no browser
runtime errors. The native host Profiler test remains complementary coverage.

For each release, also record the native LaneRow tree with React Native DevTools
in a separate development build. Start profiling after mount, scroll the same
range twice, and inspect LaneRow: existing lanes must not render because of
scroll; entering and leaving lanes may mount and unmount. Export the profile and
attach it with the build identity. Do not use development-build timings as the
release fps or cold-layout evidence.

## Android release capture

Use a physical Pixel 6a class device, a 60 Hz display mode, and the exact release
candidate commit. Record device model, Android version, display resolution and
density, power mode, thermal state, Bun version, build identity, and date. Close
other apps, disable battery saver, and let a hot device cool before capture.
Do not describe a browser or emulator result as device evidence.

1. Install dependencies and pass `bun run check`. From `demo`, run
   `bunx expo run:android --variant release --device`. This generates native files
   locally; do not commit generated Android files or install hooks. Keep the
   release JavaScript bundle and Hermes enabled. Do not attach a remote JS debugger.
2. Use Android Studio's release variant with low-overhead profiling. If the local
   generated manifest lacks it, enable `<profileable android:shell="true" />`
   under `<application>` in the release manifest and rebuild the same source
   commit. Record that profiling-only manifest change in the capture. Use a
   profileable, non-debuggable release APK. Android documents
   [profileable release builds](https://developer.android.com/studio/profile).
3. Open the app's 200-lane gallery. Select week, UTC, 15 min, and Sort: label;
   leave the rule hours at their default. Record the native viewport's visible
   lane count and dimensions. The cold-layout button always measures 24 lanes
   even when the physical screen shows fewer; do not mislabel the phone's visible
   lane count as 24. For a strict 24-row scroll comparison, use Android display
   size/density settings to fit 24 rows and record those settings with the trace.
4. In Android Studio Profiler, capture a System Trace while flinging vertically
   for a continuous five-second interval. Inspect the Frames/Frame Lifecycle
   tracks, including app, RenderThread, and composition. Select exactly the
   five-second fling interval, excluding startup. Report presented frames divided
   by five, missed deadlines, and dropped/janky frames. Acceptance is 60 fps and
   zero dropped frames during that interval, not an average that hides jank.
   Save the trace and a screenshot with the selected time span and frame tracks.
   See [recording a system trace](https://developer.android.com/studio/profile/cpu-profiler).
5. Return to the top, press Next, let expansion finish, and press
   **Measure cold layout**. This handler clears layout, coverage, and expansion
   caches outside the timer, then calls `layoutLane` for exactly 24 label-sorted
   lanes of the selected week. It displays elapsed `performance.now()` milliseconds,
   24 runs, zero hits, and the absolute window start. Screenshot that result and
   the build identity on the gallery home screen. Keep an Android system trace
   over this action to capture scheduling or thermal contention; the displayed
   JavaScript timer, rather than a sampled native stack, defines the layout duration.
6. Repeat the cold capture five times, clearing through the button every time,
   and post every value. Require each below 16 ms. Also attach the separate
   LaneRow development profile described above. If any result fails, investigate
   before requesting release approval; do not discard the slow run.

Paste this in a comment on the release PR:

```text
Performance evidence for commit: <full SHA>
Date/time and timezone: <value>
Device / Android / display Hz / resolution / density: <values>
Build: release, Hermes, profileable; profiling-only manifest change: <details>
Native viewport: <width x height, visible lanes>; W seed 1318, 200 lanes,
7 days, 2 layers, 63 rects + 7 gap rects per lane, 15-minute ticks
5 s fling: <frames / fps / missed deadlines / dropped frames>
Next-week target-cold layout, 24 runs / 0 hits: <all five ms values>
CI run: <link>; layout / coverage medians: <values>; sizes: <values>
Attachments: <system trace, frame screenshot, layout screenshots, build identity>
LaneRow development profile: <link, commit, build mode, mount/update audit>
Result: <pass or fail; explain missing evidence>
```

The GitHub `release` environment's required reviewer approves against this
comment for the exact commit being released. CI cannot verify the phone or the
repository's environment settings. Missing evidence means no release approval.
See `CONTRIBUTING.md` for environment setup. No device captures have been made
as part of issue #9's implementation.

## react-big-scheduler comparison procedure

Run this only when the legacy consumer checkout and its owner-provided data
mapping are available. It is not a dependency or CI fixture of this package.

1. Export workload W's same absolute bounds, intervals, gaps, source identities,
   lane order, and 24-row viewport into the legacy wrapper's accepted input.
   Keep 15-minute ticks, the same visible time range, and both layers. Record any
   fidelity loss, such as unsupported gaps or provenance, before comparing.
2. Build both web apps in production mode at recorded commits. On the same idle
   machine, use the same Chromium version, viewport, display refresh rate, and
   CPU throttling setting. Disable extensions and background tabs.
3. Record five seconds of the same vertical scroll range in the browser
   performance panel. Measure presented fps and dropped frames. Separately time
   a next-week target-cold preparation of the 24 visible lanes. Clear each
   implementation's corresponding caches before every sample; describe the
   legacy timing boundary because it may mix preparation and rendering.
4. Warm the JS runtime five times, then retain all 11 cold samples and their
   median for each implementation. Save raw traces and data. Report versions,
   hardware, OS, date, commits, method, and any non-equivalent work in the README.
   Keep browser numbers separate from Android numbers.

The README comparison table intentionally says **not yet measured**. No claim of
relative speed is justified until both implementations have comparable receipts.
