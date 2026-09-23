import '../support/native-host';
import { afterEach, describe, expect, it, mock } from 'bun:test';
import type { ComponentType, ReactElement } from 'react';
import { Component, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type {
  IntervalInput,
  RosterIncompleteInput,
  RosterProps,
  ScheduleDayHeaderInput,
  ScheduleProps,
} from '../../src';
import {
  Roster,
  RosterBody,
  RosterGap,
  RosterGrid,
  RosterHeader,
  RosterHeaderCell,
  RosterLaneLabel,
  RosterLaneLabelColumn,
  Schedule,
  ScheduleColumn,
  ScheduleGrid,
  ScheduleGutter,
  ScheduleIncomplete,
  ScheduleNowLine,
  ScheduleSkippedDate,
  ScheduleTransition,
} from '../../src';
import { RosterIncomplete } from '../../src/components/roster/lanes/parts/incomplete';
import { rosterFixtures, rosterWindowSpec } from '../fixtures/roster';
import { scheduleFixtures, scheduleLane } from '../fixtures/schedule';

const trees: ReactTestRenderer[] = [];
function render(element: ReactElement) {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  trees.push(tree);
  for (const node of tree.root.findAll(
    (node) => typeof node.type === 'string' && node.props.onLayout,
  )) {
    act(() => node.props.onLayout({ nativeEvent: { layout: { width: 800, height: 480 } } }));
  }
  return tree;
}
afterEach(() => {
  for (const tree of trees.splice(0)) act(() => tree.unmount());
  mock.restore();
});

function classSlot<P extends object>(Default: ComponentType<P>) {
  return class Slot extends Component<P> {
    override render() {
      return <Default {...this.props} />;
    }
  };
}

function StatefulInterval({ lane, highlighted }: IntervalInput) {
  const [count, setCount] = useState(0);
  return (
    <Pressable testID="stateful-interval" onPress={() => setCount(count + 1)}>
      <Text>
        {lane.label}:{count}:{String(highlighted)}
      </Text>
    </Pressable>
  );
}

function StatefulIncomplete({ lane, geometry, width, label }: RosterIncompleteInput) {
  const [count, setCount] = useState(0);
  return (
    <Pressable testID="stateful-incomplete" onPress={() => setCount(count + 1)}>
      <Text>
        {lane.label}:{geometry.rects.length}:{width}:{label}:{count}
      </Text>
    </Pressable>
  );
}

function StatefulDayHeader({ day, onPress }: ScheduleDayHeaderInput) {
  const [count, setCount] = useState(0);
  return (
    <Pressable
      testID={`stateful-day-header-${day.localDate}`}
      onPress={() => {
        setCount(count + 1);
        onPress?.();
      }}
    >
      <Text>
        {day.localDate}:{count}
      </Text>
    </Pressable>
  );
}

const rosterSlots = {
  headerComponent: classSlot(RosterHeader),
  headerCellComponent: classSlot(RosterHeaderCell),
  laneLabelComponent: classSlot(RosterLaneLabel),
  laneLabelColumnComponent: classSlot(RosterLaneLabelColumn),
  bodyComponent: classSlot(RosterBody),
  gridComponent: classSlot(RosterGrid),
  intervalComponent: classSlot(StatefulInterval),
  gapComponent: classSlot(RosterGap),
  incompleteComponent: classSlot(RosterIncomplete),
} satisfies Partial<RosterProps>;
const scheduleSlots = {
  gutterComponent: classSlot(ScheduleGutter),
  gridComponent: classSlot(ScheduleGrid),
  dayHeaderComponent: classSlot(StatefulDayHeader),
  skippedDateComponent: classSlot(ScheduleSkippedDate),
  columnComponent: classSlot(ScheduleColumn),
  transitionComponent: classSlot(ScheduleTransition),
  nowLineComponent: classSlot(ScheduleNowLine),
  intervalComponent: classSlot(StatefulInterval),
  gapComponent: classSlot(RosterGap),
  incompleteComponent: classSlot(ScheduleIncomplete),
} satisfies Partial<ScheduleProps>;

describe('component slot mounting and identity', () => {
  it('mounts every Roster slot as a class and retains independent interval hook state', () => {
    const props = {
      ...rosterSlots,
      lanes: [
        ...rosterFixtures['two-layers'].lanes,
        ...rosterFixtures['full-day-gap'].lanes,
        ...rosterFixtures['never-set'].lanes.filter((lane) => lane.complete === false),
      ],
      windowSpec: rosterWindowSpec,
      cornerZone: <Text>Corner node</Text>,
    };
    const tree = render(<Roster {...props} />);
    for (const Slot of Object.values(rosterSlots))
      expect(tree.root.findAllByType(Slot).length).toBeGreaterThan(0);
    const intervals = tree.root.findAllByProps({ testID: 'stateful-interval' });
    expect(intervals.length).toBeGreaterThan(1);
    act(() => intervals[0]?.props.onPress());
    expect(intervals[0]?.findByType(Text).props.children).toContain(1);
    expect(intervals[1]?.findByType(Text).props.children).toContain(0);
    const instance = tree.root.findAllByType(rosterSlots.intervalComponent)[0]?.instance;
    const input = { ...props, highlightSource: { kind: 'rule', id: 'one' } };
    act(() => tree.update(<Roster {...input} />));
    expect(tree.root.findAllByType(rosterSlots.intervalComponent)[0]?.instance).toBe(instance);
    expect(
      tree.root.findAllByProps({ testID: 'stateful-interval' })[0]?.findByType(Text).props.children,
    ).toContain(1);
    expect(JSON.stringify(tree.toJSON())).toContain('true');
    // A replacement class changes the content key and remounts retained lane content.
    const Replacement = classSlot(StatefulInterval);
    act(() => tree.update(<Roster {...input} intervalComponent={Replacement} />));
    expect(tree.root.findAllByType(rosterSlots.intervalComponent)).toHaveLength(0);
    expect(tree.root.findAllByType(Replacement).length).toBeGreaterThan(0);
    expect(
      tree.root.findAllByProps({ testID: 'stateful-interval' })[0]?.findByType(Text).props.children,
    ).toContain(0);
    act(() => tree.update(<Roster {...input} incompleteComponent={StatefulIncomplete} />));
    expect(tree.root.findAllByType(rosterSlots.incompleteComponent)).toHaveLength(0);
    const incomplete = tree.root
      .findAllByProps({ testID: 'stateful-incomplete' })
      .find((node) => node.findByType(Text).props.children[0] === 'Incomplete lane');
    expect(incomplete).toBeDefined();
    if (!incomplete) throw new Error('Missing incomplete lane slot');
    expect(incomplete.findByType(Text).props.children).toEqual([
      'Incomplete lane',
      ':',
      0,
      ':',
      5040,
      ':',
      'Availability may be incomplete',
      ':',
      0,
    ]);
    act(() => incomplete.props.onPress());
    expect(incomplete.findByType(Text).props.children).toContain(1);
  });

  it('accepts singleton nodes including null, without calling them', () => {
    const tree = render(<Roster lanes={[]} windowSpec={rosterWindowSpec} emptyZone="Empty node" />);
    expect(JSON.stringify(tree.toJSON())).toBe('"Empty node"');
    act(() => tree.update(<Roster lanes={[]} windowSpec={rosterWindowSpec} emptyZone={null} />));
    expect(tree.toJSON()).toBeNull();
    act(() =>
      tree.update(
        <Roster
          lanes={rosterFixtures['single-lane'].lanes}
          windowSpec={rosterWindowSpec}
          cornerZone={null}
        />,
      ),
    );
    expect(tree.root.findAllByType(RosterHeader).length).toBe(1);
  });

  it('mounts all Schedule classes, preserves hooks, and mounts skipped dates conditionally', () => {
    const windowSpec = scheduleFixtures['schedule-fall'].windowSpec;
    const base = scheduleLane('schedule-fall', windowSpec);
    const lane = {
      ...base,
      complete: false,
      layers: base.layers.map((layer) => ({ ...layer, gaps: layer.intervals })),
    };
    const props = {
      ...scheduleSlots,
      lane,
      windowSpec,
      now: Date.parse('2024-11-03T07:30Z'),
      onDayPress: mock(),
    };
    const tree = render(<Schedule {...props} />);
    const { skippedDateComponent, ...ordinary } = scheduleSlots;
    for (const Slot of Object.values(ordinary))
      expect(tree.root.findAllByType(Slot).length).toBeGreaterThan(0);
    expect(tree.root.findAllByType(skippedDateComponent)).toHaveLength(0);
    const dayHeader = tree.root.findAll(
      (node) =>
        typeof node.props.testID === 'string' &&
        node.props.testID.startsWith('stateful-day-header-'),
    )[0];
    const day = tree.root.findAllByType(scheduleSlots.dayHeaderComponent)[0]?.props.day;
    act(() => dayHeader?.props.onPress());
    expect(props.onDayPress).toHaveBeenCalledTimes(1);
    expect(props.onDayPress).toHaveBeenCalledWith(day);
    expect(dayHeader?.findByType(Text).props.children).toContain(1);
    const interval = tree.root.findAllByProps({ testID: 'stateful-interval' })[0];
    act(() => interval?.props.onPress());
    const instance = tree.root.findAllByType(scheduleSlots.intervalComponent)[0]?.instance;
    act(() => tree.update(<Schedule {...props} incompleteLabel="Changed notice" />));
    expect(tree.root.findAllByType(scheduleSlots.intervalComponent)[0]?.instance).toBe(instance);
    expect(
      tree.root.findAllByProps({ testID: 'stateful-interval' })[0]?.findByType(Text).props.children,
    ).toContain(1);
    expect(
      tree.root
        .findAll(
          (node) =>
            typeof node.props.testID === 'string' &&
            node.props.testID.startsWith('stateful-day-header-'),
        )[0]
        ?.findByType(Text).props.children,
    ).toContain(1);
    const apia = { span: 'week', anchorDate: '2011-12-26', timezone: 'Pacific/Apia' } as const;
    act(() => tree.update(<Schedule {...props} windowSpec={apia} />));
    expect(tree.root.findAllByType(skippedDateComponent)).toHaveLength(1);
  });
});
