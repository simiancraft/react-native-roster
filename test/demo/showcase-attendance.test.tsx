/// <reference types="nativewind/types" />
import '../support/native-host';
import { afterEach, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { EventDetail } from '../../demo/components/team-roster/events';
import type { Attendance, MemberEvent } from '../../demo/components/team-roster/events/event.types';
import {
  AbsentRow,
  AttendedRow,
  ExpectedRow,
  PendingRow,
  PresentRow,
} from '../../demo/components/team-roster/events/parts/attendances';
import {
  FutureCaption,
  LiveCaption,
  PastCaption,
} from '../../demo/components/team-roster/events/parts/axis';
import {
  actualExtent,
  attendanceModelFor,
  barOffsets,
  eventFor,
} from '../../demo/components/team-roster/events/utils/attendance';
import {
  TeamInterval,
  TeamScheduleInterval,
} from '../../demo/components/team-roster/parts/layer-fillers';
import {
  type TeamRosterModel,
  useTeamRoster,
} from '../../demo/components/team-roster/use-team-roster';
import { selectionFor } from '../../demo/components/team-roster/utils/selection';
import {
  eventsFor,
  laneFor,
  memberMeta,
  seededNow,
  teamFor,
} from '../../demo/components/team-roster/utils/team';
import { expandRuleSet } from '../../src/adapters/rrule';
import type { IntervalDetailInput } from '../../src/components/roster/roster.types';
import { layoutLane, windowFor } from '../../src/core';

const team = teamFor();
const window = windowFor({ span: 'day', anchorDate: '2026-01-05', timezone: 'America/Chicago' });
const now = seededNow();
const lanes = team.members.map((member) =>
  laneFor(member, window, expandRuleSet, () => '#38bdf8', team.members, now),
);
const events = lanes.flatMap((lane) => memberMeta(lane).events);
const trees: ReactTestRenderer[] = [];
function render(element: React.ReactElement) {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  trees.push(tree);
  return tree;
}
afterEach(() => {
  for (const tree of trees.splice(0)) act(() => tree.unmount());
});

it('generates deterministic people and all five presence states across event boundaries', () => {
  expect(teamFor()).toEqual(team);
  expect(events).toEqual(
    team.members.flatMap((member) => eventsFor(member, window, team.members, now)),
  );
  expect(now).toBeGreaterThan(window.start);
  expect(now).toBeLessThan(window.end);
  const states = new Set<string>();
  const shapes = new Set<string>();
  for (const member of team.members) {
    const completed = eventsFor(member, window, team.members, window.end + 86400000);
    for (const event of completed) {
      const clocks = [
        event.start,
        event.start + 60000,
        event.end - 60000,
        event.end,
        window.end + 86400000,
      ];
      for (const clock of clocks) {
        const current = eventsFor(member, window, team.members, clock).find(
          (item) => item.id === event.id,
        );
        if (!current) throw new Error('Expected event');
        expect(current.expected).toEqual(event.expected);
        expect(current.attendances).toHaveLength(current.expected.length);
        expect(current.attendances.find((row) => row.attendeeId === member.id)?.state).not.toBe(
          'absent',
        );
        expect(attendanceModelFor(current, clock).status).toBe(
          clock <= event.start ? 'future' : clock < event.end ? 'live' : 'past',
        );
        for (const row of current.attendances) {
          states.add(row.state);
          if (clock <= event.start) expect(row.state).toBe('expected');
          if (clock >= event.end) expect(['present', 'attended', 'absent']).toContain(row.state);
          if (row.state === 'present') {
            expect(row.arrival).toBeLessThanOrEqual(clock);
            expect(row).not.toHaveProperty('end');
            expect(row).not.toHaveProperty('departure');
            const final = event.attendances.find((item) => item.attendeeId === row.attendeeId);
            if (!final) throw new Error('Expected attendance');
            expect(final.state).toBe('attended');
            if (final.state === 'attended') {
              expect(final.start).toBe(row.arrival);
              expect(final.end).toBeGreaterThan(clock);
            }
          }
          if (row.state === 'pending') {
            expect(clock).toBeGreaterThan(event.start);
            expect(clock).toBeLessThan(event.end);
            const final = event.attendances.find((item) => item.attendeeId === row.attendeeId);
            if (!final) throw new Error('Expected attendance');
            if (final.state === 'attended') expect(final.start).toBeGreaterThan(clock);
          }
          if (row.state === 'attended') {
            expect(row.start).toBeLessThan(row.end);
            expect(row.end).toBeLessThanOrEqual(clock);
          }
        }
      }
      for (const row of event.attendances) {
        if (row.state === 'absent') shapes.add('no-show');
        if (row.state !== 'attended') continue;
        if (row.start === event.start && row.end === event.end) shapes.add('on-time');
        if (row.start > event.start) shapes.add('late');
        if (row.start < event.start) shapes.add('early-arrival');
        if (row.end < event.end) shapes.add('early-departure');
        if (row.end > event.end) shapes.add('late-departure');
      }
    }
  }
  expect([...states].sort()).toEqual(['absent', 'attended', 'expected', 'pending', 'present']);
  expect([...shapes].sort()).toEqual([
    'early-arrival',
    'early-departure',
    'late',
    'late-departure',
    'no-show',
    'on-time',
  ]);
});

it('keeps a solo lane owner present in the no-show shape', () => {
  for (const member of team.members) {
    for (const event of eventsFor(member, window, [member], window.end + 86400000)) {
      expect(event.attendances).toHaveLength(1);
      expect(event.attendances[0]?.state).toBe('attended');
    }
  }
});

it('selects the named row, caption, and bar for each presence state', () => {
  const cases = [
    [{ state: 'expected' }, ExpectedRow, 'scheduled', 0],
    [{ state: 'pending' }, PendingRow, 'not yet arrived', 0],
    [{ state: 'present', arrival: 0 }, PresentRow, 'arrived on plan, still here', 1],
    [{ state: 'present', arrival: 60000 }, PresentRow, 'arrived 1 min late, still here', 1],
    [{ state: 'present', arrival: -60000 }, PresentRow, 'arrived 1 min early, still here', 1],
    [{ state: 'attended', start: 0, end: 120000 }, AttendedRow, 'departure 1 min early', 1],
    [{ state: 'absent' }, AbsentRow, 'no-show', 0],
  ] as const;
  for (const [presence, Component, caption, bars] of cases) {
    const input = inputFor(
      [{ attendeeId: 'a', ...presence }],
      presence.state === 'expected'
        ? 0
        : presence.state === 'absent' || presence.state === 'attended'
          ? 240000
          : 120000,
    );
    const tree = render(<EventDetail {...input} />);
    expect(tree.root.findAllByType(Component)).toHaveLength(1);
    expect(JSON.stringify(tree.toJSON())).toContain(caption);
    expect(tree.root.findAllByProps({ testID: 'attendance-scheduled' })).toHaveLength(1);
    expect(tree.root.findAllByProps({ testID: 'attendance-actual' })).toHaveLength(bars);
    if (presence.state === 'present') {
      const event = requiredEvent(input);
      const scale = attendanceModelFor(event, memberMeta(input.lane).now).scale;
      const bar = barOffsets({ start: presence.arrival, end: memberMeta(input.lane).now }, scale);
      expect(tree.root.findByProps({ testID: 'attendance-actual' }).props.style).toEqual({
        left: `${bar.left}%`,
        width: `${bar.width}%`,
      });
    }
  }
});

it('spans live arrivals through the latest departure or present clock and omits pending-only strips', () => {
  for (const departure of [60000, 150000]) {
    const input = inputFor(
      [
        { attendeeId: 'a', state: 'present', arrival: -60000 },
        { attendeeId: 'b', state: 'attended', start: 0, end: departure },
        { attendeeId: 'c', state: 'pending' },
      ],
      150000,
    );
    const event = requiredEvent(input);
    expect(actualExtent(event, memberMeta(input.lane).now)).toEqual({ start: -60000, end: 150000 });
    expect(attendanceModelFor(event, memberMeta(input.lane).now).scale).toEqual({
      start: -60000,
      end: 180000,
    });
    const tree = render(<TeamInterval {...input} />);
    expect(tree.root.findByProps({ testID: 'team-attendance-strip' }).props.style).toEqual(
      barOffsets({ start: -60000, end: 150000 }, event, 100),
    );
    expect(JSON.stringify(tree.toJSON())).toContain('overflow-visible');
  }
  for (const state of ['pending', 'expected'] as const) {
    const input = inputFor([{ attendeeId: 'a', state }], state === 'expected' ? 0 : 120000);
    expect(actualExtent(requiredEvent(input), memberMeta(input.lane).now)).toBeNull();
    expect(
      render(<TeamInterval {...input} />).root.findAllByProps({ testID: 'team-attendance-strip' }),
    ).toHaveLength(0);
  }
  expect(
    actualExtent(
      requiredEvent(inputFor([{ attendeeId: 'a', state: 'present', arrival: 120000 }], 120000)),
      120000,
    ),
  ).toBeNull();
});

it('retains early, late, and overhanging offsets', () => {
  for (const [start, end, left, width] of [
    [10, 100, 10, 90],
    [0, 80, 0, 80],
    [-20, 120, -20, 140],
  ] as const) {
    expect(barOffsets({ start, end }, { start: 0, end: 100 })).toEqual({
      left,
      width,
    });
  }
});

it('routes event presses to no inspector detail and retains the member', () => {
  const input = inputFor([]);
  const { member } = memberMeta(input.lane);
  expect(selectionFor(member, input.rect)).toEqual({ kind: 'none', member });
  const missing = { ...input, rect: { ...input.rect, sources: [] } };
  expect(eventFor(missing)).toBeUndefined();
  expect(JSON.stringify(render(<EventDetail {...missing} />).toJSON())).toContain('Working hours');
});

function inputFor(attendances: Attendance[], clock = 120000): IntervalDetailInput {
  const lane = lanes[0];
  if (!lane) throw new Error('Expected lane');
  const layer = lane.layers[1];
  if (!layer) throw new Error('Expected layer');
  const event: MemberEvent = {
    id: 'example',
    kind: 'meeting',
    title: 'Project review',
    description: 'Review the next steps.',
    start: 0,
    end: 180000,
    facts: [],
    attendances,
    expected: attendances.map((row) => ({ id: row.attendeeId, name: `Person ${row.attendeeId}` })),
  };
  const eventLayer = {
    ...layer,
    intervals: [
      { start: event.start, end: event.end, sources: [{ kind: event.kind, id: event.id }] },
    ],
  };
  return {
    lane: {
      ...lane,
      layers: [eventLayer],
      meta: { ...memberMeta(lane), events: [event], now: clock },
    },
    layer: eventLayer,
    start: event.start,
    end: event.end,
    viewTimezone: 'UTC',
    highlighted: false,
    rect: {
      x: 0,
      y: 0,
      width: 100,
      height: 44,
      z: 1,
      layerId: layer.id,
      sources: [{ kind: event.kind, id: event.id }],
    },
  };
}

function requiredEvent(input: IntervalDetailInput): MemberEvent {
  const event = eventFor(input);
  if (!event) throw new Error('Expected event');
  return event;
}

it('generates local dates on both sides of a Chicago day and across DST', () => {
  const original = team.members[0];
  if (!original) throw new Error('Expected member');
  for (const timezone of ['America/Los_Angeles', 'Asia/Tokyo']) {
    const member = { ...original, timezone, workdays: [0, 1, 2, 3, 4, 5, 6] as const };
    for (const anchorDate of ['2026-01-05', '2026-03-08', '2026-03-09']) {
      const bounds = windowFor({ span: 'day', anchorDate, timezone: 'America/Chicago' });
      const localMember = {
        ...member,
        workdays: [...member.workdays],
        hours: { start: 9, end: 17 },
      };
      const generated = eventsFor(localMember, bounds);
      expect(generated.length).toBeGreaterThan(0);
      for (const event of generated) {
        const hour = Number(
          new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            hourCycle: 'h23',
          }).format(event.start),
        );
        expect(hour).toBeGreaterThanOrEqual(9);
        expect(hour).toBeLessThan(17);
        expect(event.start).toBeLessThan(bounds.end);
        expect(event.end).toBeGreaterThan(bounds.start);
      }
      const lane = laneFor(localMember, bounds, expandRuleSet, () => '#fff');
      for (const interval of lane.layers[1]?.intervals ?? []) {
        expect(interval.start).toBeGreaterThanOrEqual(bounds.start);
        expect(interval.end).toBeLessThanOrEqual(bounds.end);
      }
    }
  }
  const losAngeles = lanes.filter((lane) => lane.timezone === 'America/Los_Angeles');
  expect(losAngeles).toHaveLength(2);
  for (const lane of losAngeles) expect(memberMeta(lane).events.length).toBeGreaterThan(0);
});

it('keeps facts and actual departures stable through consecutive clock instants', () => {
  let checked = 0;
  for (const member of team.members) {
    for (const event of eventsFor(member, window, team.members, window.end + 86400000)) {
      for (const fact of event.facts) {
        if (fact.departure === null || fact.departure <= event.end) continue;
        for (const clock of [
          event.end - 1,
          event.end,
          event.end + 1,
          fact.departure - 1,
          fact.departure,
          fact.departure + 1,
        ]) {
          const current = eventsFor(member, window, team.members, clock).find(
            (item) => item.id === event.id,
          );
          if (!current) throw new Error('Expected event');
          expect(current.facts).toEqual(event.facts);
          expect(current).not.toHaveProperty('now');
          const row = current.attendances.find((item) => item.attendeeId === fact.attendeeId);
          expect(row?.state).toBe(clock < fact.departure ? 'present' : 'attended');
          if (row?.state === 'attended') expect(row.end).toBe(fact.departure);
        }
        checked++;
      }
    }
  }
  expect(checked).toBeGreaterThan(0);
});

it('never overlaps member events and requires the exact source set', () => {
  const week = windowFor({ span: 'week', anchorDate: '2026-01-05', timezone: 'America/Chicago' });
  for (const member of team.members) {
    const generated = eventsFor(member, week, team.members);
    for (let index = 1; index < generated.length; index++) {
      expect(generated[index]?.start).toBeGreaterThanOrEqual(generated[index - 1]?.end ?? 0);
    }
  }
  const input = inputFor([]);
  expect(
    eventFor({
      ...input,
      rect: { ...input.rect, sources: [...input.rect.sources, { kind: 'meeting', id: 'another' }] },
    }),
  ).toBeUndefined();
});

it('draws separate strips for disjoint attendances and keeps one detail extent', () => {
  const input = inputFor([
    { attendeeId: 'a', state: 'attended', start: 0, end: 30000 },
    { attendeeId: 'b', state: 'attended', start: 90000, end: 120000 },
  ]);
  const tree = render(<TeamInterval {...input} />);
  const strips = tree.root.findAllByProps({ testID: 'team-attendance-strip' });
  expect(strips).toHaveLength(2);
  expect(strips.map((strip) => strip.props.style)).toEqual([
    { left: 0, width: 100 / 6 },
    { left: 50, width: 100 / 6 },
  ]);
  expect(actualExtent(requiredEvent(input), 120000)).toEqual({ start: 0, end: 120000 });
});

it('mounts exactly one caption for each event status', () => {
  const captions = [FutureCaption, LiveCaption, PastCaption];
  for (const [index, clock] of [0, 120000, 180000].entries()) {
    const tree = render(<EventDetail {...inputFor([], clock)} />);
    for (const [captionIndex, Caption] of captions.entries()) {
      expect(tree.root.findAllByType(Caption)).toHaveLength(captionIndex === index ? 1 : 0);
    }
  }
});

it('uses column rect geometry without a horizontal attendance strip', () => {
  const input = inputFor([{ attendeeId: 'a', state: 'attended', start: 0, end: 120000 }]);
  const rect = { ...input.rect, x: 3, y: 252, width: 36, height: 56, column: 2 };
  const tree = render(<TeamScheduleInterval {...input} rect={rect} />);
  expect(tree.root.findByProps({ testID: 'team-schedule-event' }).props.style).toEqual({
    position: 'absolute',
    left: 3,
    top: 252,
    width: 36,
    height: 56,
    zIndex: 1,
  });
  expect(tree.root.findAllByProps({ testID: 'team-attendance-strip' })).toHaveLength(0);
});

it('invalidates geometry when a different team uses the same lane id and window', () => {
  const first = team.members[0];
  const second = teamFor(981).members[0];
  if (!first || !second) throw new Error('Expected members');
  const a = laneFor(first, window, expandRuleSet, () => '#fff');
  const b = laneFor(second, window, expandRuleSet, () => '#fff');
  const projection = {
    orientation: 'horizontal' as const,
    viewTimezone: 'America/Chicago',
    pxPerMinute: 1,
    rowHeight: 56,
  };
  expect(a.id).toBe(b.id);
  expect(a.version).toBeUndefined();
  expect(layoutLane(b, window, projection).rects).not.toEqual(
    layoutLane(a, window, projection).rects,
  );
});

it('retains lane identities on selection and expands the inspector week in day mode', () => {
  let model!: TeamRosterModel;
  function Probe() {
    model = useTeamRoster({ team });
    return null;
  }
  render(<Probe />);
  const before = model.lanes;
  const second = before[1];
  if (!second) throw new Error('Expected second member');
  act(() => model.selectMember(second.id));
  expect(model.lanes.length).toBe(before.length);
  for (const [index, lane] of model.lanes.entries()) expect(lane === before[index]).toBe(true);
  if (model.status !== 'ready') throw new Error('Expected ready roster');
  expect(model.span).toBe('day');
  const week = windowFor(model.weekWindowSpec);
  const expected = laneFor(
    model.selectedMember,
    week,
    expandRuleSet,
    () => '#fff',
    team.members,
    now,
  );
  expect(memberMeta(model.weekLane).events).toEqual(memberMeta(expected).events);
  expect(memberMeta(model.weekLane).events.some((event) => event.start >= window.end)).toBe(true);
});

it('defaults every host component when explicitly undefined', () => {
  // Isolate the additional TextInput host from the suite's already loaded native module.
  const hosts = readFileSync(new URL('../support/native-host.ts', import.meta.url), 'utf8').replace(
    "Text: 'Text',",
    "Text: 'Text', TextInput: 'TextInput',",
  );
  const script =
    hosts +
    `
    const { strict: assert } = await import('node:assert');
    const { act, create } = await import('react-test-renderer');
    const { TeamRosterScreen } = await import('./demo/components/team-roster');
    const { teamFor } = await import('./demo/components/team-roster/utils/team');
    const team = teamFor();
    let tree;
    act(() => { tree = create(createElement(TeamRosterScreen, {
      team, titleComponent: undefined, actionsComponent: undefined,
      filterComponent: undefined, controlsComponent: undefined,
      cornerComponent: undefined, laneLabelComponent: undefined,
      inspectorComponent: undefined, footerComponent: undefined,
    })); });
    assert.ok(JSON.stringify(tree.toJSON()).includes(team.organization));
    assert.ok(JSON.stringify(tree.toJSON()).includes('Now'));
    act(() => tree.unmount());
  `;
  const result = Bun.spawnSync(['bun', '-e', script], { cwd: process.cwd() });
  expect(result.stderr.toString()).not.toContain('Error');
  expect(result.exitCode).toBe(0);
});
