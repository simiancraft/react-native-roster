# Migrations

Changes to public props that need consumer edits, by the version that ships them.
The changelog lists every change; this page carries only the ones with a
migration step.

## 0.1.0: slot components replace render functions

Every Roster and Schedule prop that used to take a render function now takes a
component type or a node. Props ending in `Component` accept
`ComponentType<Input>` and are mounted by React with the same input as props.
Props ending in `Zone` accept `ReactNode`. Press callbacks (`onIntervalPress`,
`onGapPress`, `onCellPress`, `onIntervalHover`, `onNavigate`) are unchanged.

| Before (0.0.x) | After (0.1.0) | Input |
| --- | --- | --- |
| `emptyZone={() => <Empty />}` | `emptyZone={<Empty />}` | none |
| `cornerZone={() => <Corner />}` | `cornerZone={<Corner />}` | none |
| `headerZone={(input) => ...}` | `headerComponent={Header}` | `HeaderInput` |
| `laneLabelColumnZone={(input) => ...}` | `laneLabelColumnComponent={LabelColumn}` | `LabelColumnInput` |
| `bodyZone={(input) => ...}` | `bodyComponent={Body}` | `BodyInput` |
| `headerCellZone={({ tick }) => ...}` | `headerCellComponent={HeaderCell}` | `{ tick: RosterTick }` |
| `laneLabelZone={(input) => ...}` | `laneLabelComponent={LaneLabel}` | `LaneLabelInput` |
| `intervalZone={(input) => ...}` | `intervalComponent={Interval}` | `IntervalInput` |
| `gapZone={(input) => ...}` | `gapComponent={Gap}` | `GapInput` |
| `gridZone={(input) => ...}` | `gridComponent={Grid}` | `GridInput` |

Schedule follows the same rule: `gutterZone`, `gridZone`, `dayHeaderZone`,
`skippedDateZone`, `columnZone`, `transitionZone`, `nowLineZone`, `intervalZone`,
`gapZone`, and `incompleteZone` become the matching `Component` props with the
same inputs.

Nested contracts renamed with them: `HeaderInput.headerCellZone` is now
`headerCellComponent`, `LabelColumnInput.laneLabelZone` is now
`laneLabelComponent`, and `BodyInput` carries `intervalComponent`,
`gapComponent`, and `gridComponent`.

Mechanical rewrite for a render function that was already a plain function of
its input:

```tsx
// Before
<Roster intervalZone={({ rect, layer }) => <Bar rect={rect} layer={layer} />} />

// After: the same function, declared once at module scope and passed as a type
function Interval({ rect, layer }: IntervalInput) {
  return <Bar rect={rect} layer={layer} />;
}
<Roster intervalComponent={Interval} />
```

Declare slot components at module scope. An inline arrow creates a new
component type every render, which remounts every interval and defeats the
body's content key.

The default parts are exported under their existing names (`RosterInterval`,
`RosterGap`, `RosterLaneLabel`, `RosterHeaderCell`, `RosterGrid`, `RosterHeader`,
`RosterLaneLabelColumn`, `RosterBody`, `RosterEmpty`, `RosterCorner`) and can be
composed inside a replacement. `RosterBody` is now built from `RosterBodyLayout`
(arranges `gridZone` and `listZone`) and `RosterLaneList` (owns the virtualized
lane list); both are exported for consumers that replace the body.
