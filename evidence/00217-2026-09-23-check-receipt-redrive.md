# Issue 217 validation receipt

Captured against `4e79a995296d2528615e14814ec29b20c7c8e47c` on 2026-09-23.

## Dependency integrity

```text
$ bun install --frozen-lockfile
bun install v1.4.2 (744846f84)
1058 packages installed
exit 0
```

## Focused native component coverage

```text
$ bun test test/components/schedule/render.test.ts
19 pass
0 fail
135 expect() calls
Ran 19 tests across 1 file.
exit 0
```

The focused cases cover the actionable default header, actual `DayColumn` identity, the date and clock-change badge, no body callback leakage, the presentational fallback, and the wholly skipped date.

## Complete repository gate

```text
$ bun run check
Checked 277 files. No fixes applied.
TypeScript library, test, and demo checks passed.
React Compiler lint passed.
Library and static web builds passed.
All files: 100.00% functions, 100.00% lines.
Knip and strict publint passed.
react-native-roster/core: 15.49 kB <= 16 kB
react-native-roster/rrule: 14.82 kB <= 15 kB
react-native-roster: 54.26 kB <= 54.26 kB
react-native-roster/nativewind: 50.28 kB <= 50.28 kB
Day header: pointer, Enter, and Space each activate the actual day exactly once.
Web performance: all action budgets pass; 24-row viewport, 26 mounted lanes.
LaneRow profiler: 14 continuously mounted lanes, zero updates on the second scroll pass; mount and update controls pass.
Selection profiler: zero mounted-row updates when opening details or dismissing on a cell.
exit 0
```

The GitHub Actions CI workflow invokes the same constituent lint, typecheck, build, export, browser, size, package, knip, and coverage commands covered by `bun run check`.
