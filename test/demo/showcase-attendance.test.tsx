/// <reference types="nativewind/types" />
import '../support/native-host';
import { afterEach, expect, it } from 'bun:test';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { EventDetail } from '../../demo/components/team-roster/events';
import {
  AbsentRow,
  AttendedRow,
  ExpectedRow,
  PendingRow,
  PresentRow,
} from '../../demo/components/team-roster/events/parts/attendances';
import type {
  Attendance,
  MemberEvent,
} from '../../demo/components/team-roster/members/member.types';
import { TeamInterval } from '../../demo/components/team-roster/parts/layer-fillers';
import {
  actualExtent,
  attendanceModelFor,
  barOffsets,
  eventFor,
} from '../../demo/components/team-roster/utils/attendance';
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
import { windowFor } from '../../src/core';

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
        expect(attendanceModelFor(current).status).toBe(
          clock <= event.start ? 'future' : clock < event.end ? 'live' : 'past',
        );
        for (const row of current.attendances) {
          states.add(row.state);
          if (clock <= event.start) expect(row.state).toBe('expected');
          if (clock >= event.end) expect(['attended', 'absent']).toContain(row.state);
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
      const scale = attendanceModelFor(event).scale;
      const bar = barOffsets({ start: presence.arrival, end: event.now }, scale);
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
    expect(actualExtent(event)).toEqual({ start: -60000, end: 150000 });
    expect(attendanceModelFor(event).scale).toEqual({ start: -60000, end: 180000 });
    const tree = render(<TeamInterval {...input} />);
    expect(tree.root.findByProps({ testID: 'team-attendance-strip' }).props.style).toEqual(
      barOffsets({ start: -60000, end: 150000 }, event, 100),
    );
    expect(JSON.stringify(tree.toJSON())).toContain('overflow-visible');
  }
  for (const state of ['pending', 'expected'] as const) {
    const input = inputFor([{ attendeeId: 'a', state }], state === 'expected' ? 0 : 120000);
    expect(actualExtent(requiredEvent(input))).toBeNull();
    expect(
      render(<TeamInterval {...input} />).root.findAllByProps({ testID: 'team-attendance-strip' }),
    ).toHaveLength(0);
  }
  expect(
    actualExtent(
      requiredEvent(inputFor([{ attendeeId: 'a', state: 'present', arrival: 120000 }], 120000)),
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
  const { member, events } = memberMeta(input.lane);
  expect(selectionFor(member, events, input.rect)).toEqual({ kind: 'none', member });
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
    now: clock,
    attendances,
    expected: attendances.map((row) => ({ id: row.attendeeId, name: `Person ${row.attendeeId}` })),
  };
  return {
    lane: { ...lane, meta: { ...memberMeta(lane), events: [event] } },
    layer,
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
