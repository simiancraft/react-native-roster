# Customize Roster and Schedule

Use the root entry for the exported components and slot input types below.
Start with the [bounded-height example](../README.md#quick-start-static-intervals),
then replace the regions your app needs. This guide includes selection lifecycle
and layout details for consumers building custom presentations.

## Roster zones

Props ending in `Component` accept `ComponentType<Input>` and are mounted by React.
Props ending in `Zone` accept `ReactNode`. Define components at module scope so
state survives rerenders; hooks and class components are supported. Compose the
exported default components inside replacements to retain scrolling, geometry,
or press behavior. Pass `null` to a node slot to suppress its default.

| Slot | Component inputs or node | Default and behavior |
| --- | --- | --- |
| `emptyZone` | `ReactNode` | `RosterEmpty`: No lanes. |
| `cornerZone` | `ReactNode` | `RosterCorner`: nothing; the cell above the labels, `laneLabelWidth` wide. |
| `laneLabelComponent` | `lane`, `flag`, `complete`, `viewTimezone`, localized labels | `RosterLaneLabel`: label, differing IANA zone badge, and notices. |
| `headerCellComponent` | `HeaderCellInput` (`tick`) | `RosterHeaderCell`: tick label. |
| `intervalComponent` | `rect`, `layer`, `lane`, `highlighted` | `RosterInterval`: positioned colored rect, with final inset bounds. |
| `intervalDetailComponent` | `rect`, `layer`, `lane`, `highlighted`, absolute `start` and `end`, `viewTimezone` | Absent by default; enables selection and fills its details. |
| `selectionLayout` | `SelectionLayoutProps`: nodes, targetBounds, open, dismissal, host, and shared scroll | `RosterSelectionPopover`: native portal or Radix web popover; replace at runtime. |
| `gapComponent` | `rect`, `layer`, `lane` | `RosterGap`: no visible content; the row supplies pressable bounds. |
| `incompleteComponent` | `RosterIncompleteInput` (`lane`, `geometry`, `width`, `label`) | `RosterIncomplete`: notice in the first empty span of an incomplete lane. |
| `nowLineComponent` | `RosterNowLineInput` (`x`, `now`) | `RosterNowLine`: noninteractive vertical red line across the body. |
| `gridComponent` | `ticks`, `contentWidth` | `RosterGrid`: one hairline per tick behind every lane. |
| `headerComponent` | `ticks`, `projection`, `scroll`, `contentWidth`, `headerCellComponent` | `RosterHeader`: frozen header following horizontal offset. |
| `laneLabelColumnComponent` | `labels`, `projection`, `scroll`, `laneLabelComponent` | `RosterLaneLabelColumn`: frozen labels following vertical offset. |
| `bodyComponent` | Ordered `lanes`, `window`, `geometryFor`, `projection`, `scroll`, `press`, `ticks`, `viewport`, `contentWidth`, `nowLine`, `nowLineComponent`, highlight and hover, incomplete label and component, and rect components | `RosterBody`: virtualized lanes. |

`RosterBody` composes `RosterBodyLayout`, which arranges `gridZone`, `listZone`, and optional `overlayZone`
nodes with scroll wiring, and `RosterLaneList`, which owns LegendList and its
per-lane callback. The body waits for viewport measurement before mounting the list.

```tsx
import type { LaneLabelInput } from 'react-native-roster';
import { Text } from 'react-native';

function LaneLabel({ lane }: LaneLabelInput) {
  return <Text>{lane.label}</Text>;
}

<Roster lanes={lanes} windowSpec={windowSpec}
  laneLabelComponent={LaneLabel} cornerZone={<Text>People</Text>} />
```

A custom interval component positions at `rect.x/y`, uses `rect.width/height/z`,
and sets `pointerEvents="none"` so the parent hit-test walk owns presses. Gap
fillers are already inside positioned pressables. Roster lanes and Schedule columns
mount these interval and gap components through the same internal layer stack.
The Roster incomplete component remains beside that collection. `useRoster` exposes ordered
lanes, coverage, lane state, ticks, `geometryFor`, shared scrolling, `press`,
viewport measurement, navigation, and status for fully custom layouts.

Chrome regions take style props: `style`, `headerStyle` (the 40 px header row
holding the corner and ticks), `laneLabelColumnStyle`, and `bodyStyle`.
`laneLabelWidth` sizes the corner and label column, default 180. Each style
prop has a `className` twin; see [NativeWind](../src/nativewind/README.md#setup-and-styling).

### Selection

Add `intervalDetailComponent` to enable pressed-interval details. The press still
fires `onIntervalPress`; without the component, presses retain no selection.
`useRoster` owns `selection` and `dismissSelection`.
Pressing the selected interval again dismisses it; pressing another interval
switches selection. Cell and gap presses dismiss selection while still firing
`onCellPress` and `onGapPress`. These rules live in the hook and apply on native
and web; web outside press and Escape still dismiss.
Removing the selected lane, layer, or interval bounds clears selection.

Native has no intercepting dismissal overlay; body presses reach the hook, and the detail
card captures its own presses. Web excludes the body wrapper from Radix outside
dismissal, leaving body presses to the hook while preserving true outside presses and Escape.
The hook toggles the selected interval closed, switches to another interval, and dismisses
on cell or gap presses while preserving their callbacks. The body restores horizontal
and vertical offsets from shared values on remount when selectionLayout changes.
A mount effect calls the horizontal ScrollView ref's scrollTo without animation;
native also retains contentOffset. LegendList restores initialScrollOffset through
its own web mount effect and native initial offset.

Current data and geometry replace old references, including after resizing or sorting. Reconciliation matches the layer id and
order-insensitive source identities, then chooses the nearest absolute bounds. The sum
of bound differences must be at most 1 ms. Stored bounds remain the display values.

`selectable?: boolean` belongs only to the hook input, `RosterInput`, and defaults to false.
It is excluded from `RosterProps`. Hook consumers
pass `selectable: true` to `useRoster` to retain selection. `intervalDetailComponent`,
`selectionLayout`, and `portalHost` live on `RosterProps` because the chassis mounts
the content and layout. The chassis enables selection with
`selectable: Boolean(intervalDetailComponent)`. Custom chassis mount their layout
with the returned selection, dismissal, and scroll inputs.

```tsx
import { Text, View } from 'react-native';
import { Roster } from 'react-native-roster';
import type { IntervalDetailInput, Lane } from 'react-native-roster';

function IntervalDetails({ lane, layer, rect, start, end, viewTimezone }: IntervalDetailInput) {
  const format = new Intl.DateTimeFormat('en-US', { timeZone: viewTimezone, timeStyle: 'short' });
  return <View style={{ padding: 16, backgroundColor: 'white' }}>
    <Text>{lane.label}: {layer.label ?? layer.id}</Text>
    <Text>{format.format(start)} to {format.format(end)}</Text>
    {rect.sources.map((source) =>
      <Text key={JSON.stringify([source.kind, source.id])}>
        {source.label ?? source.id}
      </Text>)}
  </View>;
}

export function SelectionExample({ lanes }: { lanes: Lane[] }) {
  return <Roster lanes={lanes}
    windowSpec={{ span: 'day', anchorDate: '2024-01-01', timezone: 'UTC' }}
    style={{ height: 480, flex: undefined }}
    intervalDetailComponent={IntervalDetails} />;
}
```

Web consumers install `bun add @radix-ui/react-popover@^1.1.23`. It is an optional peer
for native, core-only, and rrule-only consumers. Web root and nativewind imports
require it, including Schedule-only use. Consumers
resolving the library from source with a web bundler (Vite, Storybook, or Metro web)
must install it even without enabling selection because `selection-layout.web.tsx`
is in the module graph. Native and core-only consumers do not need it.
`RosterSelectionPopover` selects native or web through platform resolution.
Native mounts a local `PortalHost` and registers `Portal` content; web uses Radix
for portal placement, outside press, Escape, and collisions. The layout returns focus
to the previously focused element only after Escape.
The overlay tracks both scroll offsets with Reanimated shared values, without
React scroll state. Native clamps details horizontally to the measured viewport,
flips above when that fits, and uses the top edge when neither vertical placement
fits. The default native popover waits for viewport measurement and scrolls oversized
content on both axes within a maximum size of the viewport minus 8 px on each axis.
Consumers wanting a different presentation supply `selectionLayout`.
Native also dismisses on hardware back.

`selectionLayout?: ComponentType<SelectionLayoutProps>` is the layout strategy
naming exception to the `Component` suffix. The chassis mounts it with `anchorZone`
(the body), `contentZone` (details or null), `targetBounds` (body-content bounds), `open`,
`onDismiss`, `portalHost`, and `scroll`. The target bounds include the lane offset and
interval inset. Layout scroll inputs are limited to `x`, `y`, `headerStyle`, and
`labelStyle`. Render each node once. A consumer inspector
can arrange the nodes in columns and call `onDismiss` from its close button.
The [interval-detail gallery route](../demo/app/gallery/interval-detail.tsx)
switches presentations at runtime.

`portalHost` overrides the native destination name, whose default uses a unique
per-roster `useId`. Give separate rosters separate override names. The default
layout owns its host; do not also mount that name at an ancestor. Custom layouts
can instead target their own ancestor host, using the exported `PortalHost` and
`Portal`. A store-based portal does not preserve context from the registration
site; place required providers above the host or re-provide them in the content.
Selection never enters the lane list's body content key.

Schedule does not yet support selection; it is a later change.

### Consumer data in slot components

For consumer data beyond a slot's Input, mount a React context provider above
`Roster` and read it with `useContext` in a module-scope slot component. This
example supplies density and locale while keeping the header cell type stable:

```tsx
import { createContext, useContext } from 'react';
import { Text } from 'react-native';
import type { HeaderCellInput, RosterProps } from 'react-native-roster';
import { Roster } from 'react-native-roster';

type SlotPreferences = {
  density: 'compact' | 'comfortable';
  locale: string;
};

const SlotPreferencesContext = createContext<SlotPreferences>({
  density: 'comfortable',
  locale: 'en-US',
});

function LocalizedHeaderCell({ tick }: HeaderCellInput) {
  const { density, locale } = useContext(SlotPreferencesContext);
  const label = new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    ...(tick.kind === 'day'
      ? { month: 'short', day: 'numeric' }
      : { hour: 'numeric', minute: '2-digit' }),
  }).format(tick.time);

  return (
    <Text numberOfLines={1} style={{ padding: density === 'compact' ? 2 : 6 }}>
      {label}
    </Text>
  );
}

export function ConsumerRoster({ lanes }: Pick<RosterProps, 'lanes'>) {
  return (
    <SlotPreferencesContext.Provider value={{ density: 'compact', locale: 'en-GB' }}>
      <Roster
        lanes={lanes}
        windowSpec={{ span: 'week', anchorDate: '2024-01-01', timezone: 'UTC' }}
        style={{ height: 480, flex: undefined }}
        headerCellComponent={LocalizedHeaderCell}
      />
    </SlotPreferencesContext.Provider>
  );
}
```

An inline closure or a memoized factory that returns a new component per render
is not the recommended path. A new interval component type remounts every interval
and defeats the body's content key. Context supplies changing consumer data while
preserving the module-scope component type.

## Schedule zones

```tsx
import { Schedule } from 'react-native-roster';
import type { Lane } from 'react-native-roster/core';

export function Week({ lane }: { lane: Lane }) {
  return <Schedule lane={lane} minuteStep={60}
    style={{ height: 600, flex: undefined }}
    windowSpec={{ span: 'week', anchorDate: '2024-01-01', timezone: 'UTC' }}
    onDayPress={(day) => console.log(day.localDate)}
    onIntervalPress={(rect) => console.log(rect.sources)} />;
}
```

Only day and week specs are accepted. The component measures its width,
reserves a 48 px gutter, and fits the day columns without horizontal scrolling.
`pxPerHour` defaults to 48. Chrome takes `style`, `headerStyle`, `gutterStyle`,
and `daysStyle`, each with a `className` twin.

Schedule time is controlled. Omitted `now` and `now={null}` both hide the now line. Supply epoch
milliseconds for a fixed line. A host that needs a live line owns a state value and timer, for
example `const [now, setNow] = useState(() => Date.now())`, followed by an effect that calls
`setInterval(() => setNow(Date.now()), 60_000)` and clears the interval during cleanup. Pass that
state as `<Schedule now={now} ... />`. Schedule previously created this timer automatically;
migrating consumers must now supply and update `now` themselves.

`bandWindow={{ start, end }}` marks an absolute window with the default translucent band. Its pieces
are clipped to the displayed window and real day columns, including clock-change scale pieces.
Changing the band does not change the Schedule extent, lane geometry, coverage, layers, sources, or
press behavior. Omitted, empty, reversed, and nonoverlapping values draw nothing. A
`windowBandComponent` receives the root-exported `WindowBandInput` for every visible piece: the
containing `day`, zero-based `column`, clipped absolute `start` and `end`, and final `x`, `y`,
`width`, and `height`. `ScheduleWindowBand` is the root-exported default.

```tsx
import { Schedule, type WindowBandInput } from 'react-native-roster';
import { View } from 'react-native';

function FocusWindowBand({ x, y, width, height }: WindowBandInput) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: x, top: y, width, height, backgroundColor: '#2563eb33' }}
    />
  );
}

<Schedule
  lane={lane}
  windowSpec={windowSpec}
  bandWindow={{ start, end }}
  windowBandComponent={FocusWindowBand}
/>;
```

`onDayPress` receives the actual `DayColumn` when an ordinary day heading is activated. A custom
`dayHeaderComponent` receives the root-exported `ScheduleDayHeaderInput`, containing `day` and an
optional `onPress` already bound to that day. Mount the handler when present; when `onDayPress` is
omitted, the handler is absent and the default heading stays presentational instead of becoming an
inert button. Wholly skipped local dates mount `skippedDateComponent` directly, so they never
receive or expose a day action.

| Slot | Component inputs or node | Default and behavior |
| --- | --- | --- |
| `gutterComponent` | `hours`, `pxPerHour` | `ScheduleGutter`: 24 frozen hour labels. |
| `gridComponent` | `hours`, `pxPerHour` | `ScheduleGrid`: 24 bordered hour bands behind each day's rects. |
| `dayHeaderComponent` | `ScheduleDayHeaderInput` (`day`, bound optional `onPress`) | `ScheduleDayHeader`: actionable weekday, localDate, and transition badge when `onDayPress` is supplied; otherwise a presentational heading. |
| `skippedDateComponent` | `localDate` | `ScheduleSkippedDate`: zero-width header marker for a wholly skipped date, with no day action. |
| `columnComponent` | `day`, `rects`, `gapRects`, `lane`, `highlightSource`, `press`, interval and gap components | `ScheduleColumn`: final rect bounds in layer order. |
| `transitionComponent` | `day`, `transition`, `y`, `dividerY`, `height`, `width` | `ScheduleTransition`: skipped-time hatch, or repeat divider and again label. |
| `nowLineComponent` | `y`, `column` | `ScheduleNowLine`: line for the caller-supplied `now` in its containing day. |
| `windowBandComponent` | `WindowBandInput` (`day`, `column`, `start`, `end`, `x`, `y`, `width`, `height`) | `ScheduleWindowBand`: translucent piece for `bandWindow`, mounted once per visible scale piece. |
| `intervalComponent`, `gapComponent` | Same inputs as Roster | Shared `RosterInterval` and `RosterGap`. |
| `incompleteComponent` | `lane`, `label` | `ScheduleIncomplete`: notice above the grid when the lane is incomplete. |
