/// <reference types="nativewind/types" />
import '../support/native-host';
import { afterEach, expect, it, mock, spyOn } from 'bun:test';
import { readFileSync } from 'node:fs';
import { Pressable } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import type { Attendance, MemberEvent } from '../../demo/components/team-roster/events/event.types';
import type { AttendanceInteractionInput } from '../../demo/components/team-roster/events/parts/attendance-interaction.types';
import {
  actualExtent,
  actualWindows,
  attendanceModelFor,
  barOffsets,
  detailTextFor,
  eventFor,
  glyphFor,
  ticksFor,
} from '../../demo/components/team-roster/events/utils/attendance';
import { MemberInspector } from '../../demo/components/team-roster/members';
import {
  NoSelection,
  SlotSelection,
  TimeOffSelection,
} from '../../demo/components/team-roster/members/parts/selection';
import { WeekSchedule } from '../../demo/components/team-roster/members/parts/week-schedule';
import { WeekNowLine } from '../../demo/components/team-roster/members/parts/week-zones';
import {
  AvailabilityBand,
  TeamInterval,
  TeamScheduleInterval,
  TimeOffGap,
} from '../../demo/components/team-roster/parts/layer-fillers';
import {
  type TeamRosterModel,
  useTeamRoster,
} from '../../demo/components/team-roster/use-team-roster';
import { dayLabel, timeLabel } from '../../demo/components/team-roster/utils/format';
import { selectionFor } from '../../demo/components/team-roster/utils/selection';
import {
  eventsFor,
  laneFor,
  memberMeta,
  seededNow,
  teamFor,
} from '../../demo/components/team-roster/utils/team';
import { timeOffNote } from '../../demo/components/team-roster/utils/time-off';
import { expandRuleSet } from '../../src/adapters/rrule';
import type { IntervalDetailInput } from '../../src/components/roster/roster.types';
import { layoutLane, windowFor } from '../../src/core';

const Platform = { OS: 'ios' };
const { attendanceInteraction: nativeInteraction } = await import(
  '../../demo/components/team-roster/events/parts/attendance-interaction'
);
const { attendanceInteraction: webInteraction } = await import(
  '../../demo/components/team-roster/events/parts/attendance-interaction.web'
);
mock.module('../../demo/components/team-roster/events/parts/attendance-interaction', () => ({
  attendanceInteraction(input: AttendanceInteractionInput) {
    return (Platform.OS === 'web' ? webInteraction : nativeInteraction)(input);
  },
}));
const { EventDetail } = await import('../../demo/components/team-roster/events');

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

it('selects compact glyphs and actual bars for every presence state', () => {
  const cases = [
    [{ state: 'expected' }, '', 0],
    [{ state: 'pending' }, '○', 0],
    [{ state: 'present', arrival: 0 }, '●', 1],
    [{ state: 'attended', start: 0, end: 120000 }, '', 1],
    [{ state: 'absent' }, '×', 0],
  ] as const;
  for (const [presence, glyph, bars] of cases) {
    const input = inputFor(
      [{ attendeeId: 'a', ...presence }],
      presence.state === 'expected' ? 0 : 240000,
    );
    const tree = render(<EventDetail {...input} />);
    expect(glyphFor(presence.state)).toEqual({
      glyph,
      emphasis: presence.state === 'present' ? 'primary' : 'muted',
    });
    expect(tree.root.findByProps({ accessibilityLabel: presence.state }).props.className).toBe(
      presence.state === 'present' ? 'text-primary' : 'text-muted-foreground',
    );
    expect(tree.root.findByProps({ accessibilityLabel: presence.state }).props.children).toBe(
      glyph,
    );
    expect(tree.root.findAllByProps({ testID: 'attendance-scheduled' })).toHaveLength(1);
    expect(tree.root.findAllByProps({ testID: 'attendance-actual' })).toHaveLength(bars);
    expect(tree.root.findAllByProps({ testID: 'attendance-tooltip' })).toHaveLength(0);
  }
});

it('omits actual bars and strips when a present attendee arrives exactly now', () => {
  const input = inputFor([{ attendeeId: 'a', state: 'present', arrival: 120000 }], 120000);
  expect(actualWindows(requiredEvent(input), 120000)).toEqual([]);
  const tree = render(<EventDetail {...input} />);
  expect(tree.root.findAllByProps({ testID: 'attendance-actual' })).toHaveLength(0);
  expect(tree.root.findAllByProps({ testID: 'attendance-empty' })).toHaveLength(1);
  expect(tree.root.findByProps({ accessibilityLabel: 'present' }).props.children).toBe('●');
  const interval = render(<TeamInterval {...input} />);
  expect(interval.root.findAllByProps({ testID: 'team-attendance-strip' })).toHaveLength(0);
});

for (const platform of ['web', 'ios'] as const) {
  it(`resets active attendance when selection switches event on ${platform}`, () => {
    const previous = Platform.OS;
    Platform.OS = platform;
    try {
      const first = inputFor([{ attendeeId: 'a', state: 'pending' }]);
      const second = inputFor([{ attendeeId: 'a', state: 'absent' }], 240000);
      requiredEvent(second).id = 'another-event';
      second.rect.sources = [{ kind: 'meeting', id: 'another-event' }];
      const tree = render(<EventDetail {...first} />);
      const activate = platform === 'web' ? 'onHoverIn' : 'onPress';
      act(() => tree.root.findByType(Pressable).props[activate]({ stopPropagation() {} }));
      expect(tree.root.findByProps({ testID: 'attendance-status' }).props.children).toBe(
        'Person a · Not yet arrived',
      );
      act(() => tree.update(<EventDetail {...first} />));
      expect(tree.root.findByProps({ testID: 'attendance-status' }).props.children).toBe(
        'Person a · Not yet arrived',
      );
      act(() => tree.update(<EventDetail {...second} />));
      expect(tree.root.findByProps({ testID: 'attendance-status' }).props.children).toBe(
        'Actual attendance; the shaded band is the scheduled window',
      );
    } finally {
      Platform.OS = previous;
    }
  });
}

it('switches native attendance detail by tapping another row and dismisses on a second tap', () => {
  const tree = render(
    <EventDetail
      {...inputFor([
        { attendeeId: 'a', state: 'pending' },
        { attendeeId: 'b', state: 'absent' },
      ])}
    />,
  );
  const a = tree.root.findByProps({ testID: 'attendance-row-a' }).findByType(Pressable);
  const b = tree.root.findByProps({ testID: 'attendance-row-b' }).findByType(Pressable);
  const press = { stopPropagation() {} };
  act(() => a.props.onPress(press));
  expect(tree.root.findByProps({ testID: 'attendance-status' }).props.children).toBe(
    'Person a · Not yet arrived',
  );
  act(() => b.props.onPress(press));
  expect(tree.root.findByProps({ testID: 'attendance-status' }).props.children).toBe(
    'Person b · Did not attend',
  );
  act(() => b.props.onPress(press));
  expect(tree.root.findByProps({ testID: 'attendance-status' }).props.children).toBe(
    'Actual attendance; the shaded band is the scheduled window',
  );
});

it('generates half-hour ticks below three hours and hourly ticks for longer scales', () => {
  for (const [minutes, expected] of [
    [20, [0]],
    [90, [0, 30, 60, 90]],
    [179, [0, 30, 60, 90, 120, 150]],
    [180, [0, 60, 120, 180]],
    [360, [0, 60, 120, 180, 240, 300, 360]],
  ] as const) {
    const ticks = ticksFor({ start: 0, end: minutes * 60000 });
    expect(ticks.map((tick) => tick.time / 60000)).toEqual([...expected]);
    for (const tick of ticks) expect(tick.left).toBeCloseTo((100 * tick.time) / (minutes * 60000));
  }
  expect(ticksFor({ start: 10 * 60000, end: 70 * 60000 }).map((tick) => tick.left)).toEqual([
    100 / 3,
    250 / 3,
  ]);
  expect(
    ticksFor({ start: Date.UTC(2026, 0, 1), end: Date.UTC(2026, 0, 1, 3) }, 'Asia/Kathmandu').map(
      (tick) => (tick.time - Date.UTC(2026, 0, 1)) / 60000,
    ),
  ).toEqual([15, 75, 135]);
});

it('models one scheduled band and five completed bars including both overhangs', () => {
  const input = inputFor(
    Array.from({ length: 5 }, (_, index) => ({
      attendeeId: String(index),
      state: 'attended',
      start: -60000 + index * 10000,
      end: 240000 - index * 10000,
    })),
    300000,
  );
  const model = attendanceModelFor(requiredEvent(input), 300000);
  expect(model.band).toEqual({ left: 20, width: 60 });
  expect(model.rows[0]?.bar).toEqual({ left: 0, width: 100 });
  const tree = render(<EventDetail {...input} />);
  expect(tree.root.findAllByProps({ testID: 'attendance-scheduled' })).toHaveLength(1);
  expect(tree.root.findByProps({ testID: 'attendance-scheduled' }).props.style).toEqual({
    left: '20%',
    width: '60%',
  });
  expect(tree.root.findAllByProps({ testID: 'attendance-actual' })).toHaveLength(5);
  const future = inputFor(
    Array.from({ length: 5 }, (_, index) => ({ attendeeId: String(index), state: 'expected' })),
    0,
  );
  const futureTree = render(<EventDetail {...future} />);
  expect(futureTree.root.findAllByProps({ testID: 'attendance-empty' })).toHaveLength(5);
  expect(futureTree.root.findAllByProps({ testID: 'attendance-actual' })).toHaveLength(0);
  expect(futureTree.root.findAllByProps({ testID: 'attendance-scheduled' })).toHaveLength(1);
});

it('formats detail text for every state and early, on-plan, and late timings', () => {
  const event = { ...requiredEvent(inputFor([])), start: 3 * 3600000, end: 4.5 * 3600000 };
  for (const [state, text] of [
    ['expected', 'Expected to attend'],
    ['pending', 'Not yet arrived'],
    ['absent', 'Did not attend'],
  ] as const) {
    expect(detailTextFor({ attendeeId: 'a', state }, event, 'UTC')).toBe(text);
  }
  expect(
    detailTextFor(
      {
        attendeeId: 'a',
        state: 'attended',
        start: event.start + 15 * 60000,
        end: event.end - 10 * 60000,
      },
      event,
      'UTC',
    ),
  ).toBe('Arrived 3:15 AM (15 min late) · Left 4:20 AM (10 min early)');
  expect(
    detailTextFor(
      {
        attendeeId: 'a',
        state: 'attended',
        start: event.start - 15 * 60000,
        end: event.end + 10 * 60000,
      },
      event,
      'UTC',
    ),
  ).toBe('Arrived 2:45 AM (15 min early) · Left 4:40 AM (10 min late)');
  expect(
    detailTextFor({ attendeeId: 'a', state: 'present', arrival: event.start }, event, 'UTC'),
  ).toBe('Arrived 3:00 AM (on plan) · Still here');
});

for (const platform of ['web', 'ios'] as const) {
  it(`shows each attendance detail in the footer during ${platform} interaction`, () => {
    const previous = Platform.OS;
    Platform.OS = platform;
    try {
      const cases: [Attendance, number, string][] = [
        [{ attendeeId: 'a', state: 'expected' }, 0, 'Expected to attend'],
        [{ attendeeId: 'a', state: 'pending' }, 120000, 'Not yet arrived'],
        [
          { attendeeId: 'a', state: 'present', arrival: 0 },
          120000,
          'Arrived 12:00 AM (on plan) · Still here',
        ],
        [
          { attendeeId: 'a', state: 'attended', start: 0, end: 120000 },
          240000,
          'Arrived 12:00 AM (on plan) · Left 12:02 AM (1 min early)',
        ],
        [{ attendeeId: 'a', state: 'absent' }, 240000, 'Did not attend'],
      ];
      for (const [attendance, clock, detail] of cases) {
        const tree = render(<EventDetail {...inputFor([attendance], clock)} />);
        const bar = tree.root.findByType(Pressable);
        const footer = () => tree.root.findByProps({ testID: 'attendance-status' }).props.children;
        const legend = `${attendance.state === 'expected' ? 'Expected attendees' : 'Actual attendance'}; the shaded band is the scheduled window`;
        expect(footer()).toBe(legend);
        expect(bar.props.accessibilityLabel).toBe(`Person a: ${detail}`);
        const activate = platform === 'web' ? 'onHoverIn' : 'onPress';
        const deactivate = platform === 'web' ? 'onHoverOut' : 'onPress';
        act(() => bar.props[activate]({ stopPropagation() {} }));
        expect(footer()).toBe(`Person a · ${detail}`);
        expect(tree.root.findAllByProps({ testID: 'attendance-tooltip' })).toHaveLength(0);
        act(() => bar.props[deactivate]({ stopPropagation() {} }));
        expect(footer()).toBe(legend);
        if (platform === 'web') {
          for (const visible of [false, true]) {
            act(() =>
              bar.props.onFocus({
                currentTarget: {
                  matches(selector: string) {
                    expect(selector).toBe(':focus-visible');
                    return visible;
                  },
                },
              }),
            );
            expect(footer()).toBe(visible ? `Person a · ${detail}` : legend);
            act(() => bar.props.onBlur());
            expect(footer()).toBe(legend);
          }
        } else {
          expect(bar.props.onFocus).toBeUndefined();
          expect(bar.props.onBlur).toBeUndefined();
        }
        let stopped = false;
        act(() =>
          bar.props.onPress({
            stopPropagation() {
              stopped = true;
            },
          }),
        );
        expect(stopped).toBe(true);
        expect(bar.props.accessibilityRole).toBe(platform === 'web' ? undefined : 'button');
        expect(footer()).toBe(platform === 'web' ? legend : `Person a · ${detail}`);
      }
    } finally {
      Platform.OS = previous;
    }
  });
}

it('keeps the latest active row when an earlier row interaction ends', () => {
  const previous = Platform.OS;
  Platform.OS = 'web';
  try {
    const tree = render(
      <EventDetail
        {...inputFor([
          { attendeeId: 'a', state: 'pending' },
          { attendeeId: 'b', state: 'absent' },
        ])}
      />,
    );
    const a = tree.root.findByProps({ testID: 'attendance-row-a' }).findByType(Pressable);
    const b = tree.root.findByProps({ testID: 'attendance-row-b' }).findByType(Pressable);
    act(() => a.props.onHoverIn());
    expect(tree.root.findByProps({ testID: 'attendance-status' }).props.children).toBe(
      'Person a · Not yet arrived',
    );
    act(() => b.props.onHoverIn());
    act(() => a.props.onHoverOut());
    expect(tree.root.findByProps({ testID: 'attendance-status' }).props.children).toBe(
      'Person b · Did not attend',
    );
    act(() => b.props.onHoverOut());
    expect(tree.root.findByProps({ testID: 'attendance-status' }).props.children).toBe(
      'Actual attendance; the shaded band is the scheduled window',
    );
  } finally {
    Platform.OS = previous;
  }
});

for (const hoveredId of ['a', 'b']) {
  it(`retains keyboard focus when row ${hoveredId} hover ends, then restores remaining hover on blur`, () => {
    const previous = Platform.OS;
    Platform.OS = 'web';
    try {
      const tree = render(
        <EventDetail
          {...inputFor([
            { attendeeId: 'a', state: 'pending' },
            { attendeeId: 'b', state: 'absent' },
          ])}
        />,
      );
      const a = tree.root.findByProps({ testID: 'attendance-row-a' }).findByType(Pressable);
      const b = tree.root.findByProps({ testID: 'attendance-row-b' }).findByType(Pressable);
      const hovered = hoveredId === 'a' ? a : b;
      const footer = () => tree.root.findByProps({ testID: 'attendance-status' }).props.children;
      act(() => a.props.onFocus({ currentTarget: { matches: () => true } }));
      act(() => hovered.props.onHoverIn());
      expect(footer()).toBe('Person a · Not yet arrived');
      act(() => hovered.props.onHoverOut());
      expect(footer()).toBe('Person a · Not yet arrived');
      act(() => b.props.onHoverIn());
      act(() => a.props.onBlur());
      expect(footer()).toBe('Person b · Did not attend');
      act(() => a.props.onBlur());
      expect(footer()).toBe('Person b · Did not attend');
      act(() => b.props.onHoverOut());
      expect(footer()).toBe('Actual attendance; the shaded band is the scheduled window');
    } finally {
      Platform.OS = previous;
    }
  });
}

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

it('places the attendance reading key after the chart for every event status', () => {
  for (const clock of [0, 120000, 240000]) {
    const tree = render(<EventDetail {...inputFor([], clock)} />);
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain(clock === 0 ? 'Expected attendees' : 'Actual attendance');
    expect(json.indexOf('the shaded band is the scheduled window')).toBeGreaterThan(
      json.indexOf('attendance-scheduled'),
    );
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

it('navigates inspector days and defaults host slots, layouts, scheme colors, and filters', () => {
  // Isolate the additional TextInput host from the suite's already loaded native module.
  const hosts = readFileSync(new URL('../support/native-host.ts', import.meta.url), 'utf8').replace(
    "Text: 'Text',",
    "Text: 'Text', TextInput: 'TextInput',",
  );
  const script =
    hosts +
    `
    let scheme = 'light';
    mock.module('nativewind', () => ({ useColorScheme: () => ({ colorScheme: scheme }) }));
    const { strict: assert } = await import('node:assert');
    const { act, create } = await import('react-test-renderer');
    const { TeamRosterScreen } = await import('./demo/components/team-roster');
    const { teamFor } = await import('./demo/components/team-roster/utils/team');
    const { TeamRosterLayout } = await import('./demo/components/team-roster/screen-layout');
    const { TeamToolbarLayout } = await import('./demo/components/team-roster/toolbar-layout');
    const { Roster, Schedule } = await import('react-native-roster');
    const { WeekSchedule } = await import('./demo/components/team-roster/members/parts/week-schedule');
    const { SpanChips, ZoneChips } = await import('./demo/components/team-roster/parts/window-controls');
    const { MUTED_FOREGROUND_HEX } = await import('./demo/components/team-roster/utils/tones');
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
    for (const [width, density, labelWidth, direction, toolbar] of [
      [500, 'avatar', 56, 'column', 'column'],
      [700, 'compact', 148, 'column', 'row'],
      [1000, 'full', 232, 'row', 'row'],
    ]) {
      act(() => tree.root.findByType(TeamRosterLayout).props.onContentLayout({
        nativeEvent: { layout: { width, height: 800, x: 0, y: 0 } },
      }));
      const layout = tree.root.findByType(TeamRosterLayout);
      assert.equal(layout.props.direction, direction);
      assert.equal(layout.findAllByProps({ className: 'h-[600px]' }).length, direction === 'column' ? 1 : 0);
      const controls = tree.root.findByType(TeamToolbarLayout);
      assert.equal(controls.props.direction, toolbar);
      assert.equal(controls.props.filterWidth, labelWidth);
      const filterRegion = controls.findAllByType('View')[1];
      assert.deepEqual(filterRegion.props.style, toolbar === 'row' ? { width: labelWidth } : undefined);
      assert.equal(tree.root.findByType(Roster).props.laneLabelWidth, labelWidth);
      assert.equal(controls.props.filterZone.props.density, density);
    }
    const schedule = () => tree.root.findByType(Schedule);
    const roster = () => tree.root.findByType(Roster);
    const header = (label) => tree.root.findByProps({ accessibilityLabel: label });
    act(() => schedule().find(node => typeof node.props.onLayout === 'function').props.onLayout({
      nativeEvent: { layout: { width: 380, height: 600, x: 0, y: 0 } },
    }));
    assert.equal(header('Show Monday, Jan 5').props.accessibilityRole, 'button');
    assert.equal(header('Show Monday, Jan 5').props.accessibilityState.selected, true);
    assert.ok(header('Show Monday, Jan 5').props.className.includes('bg-background'));
    act(() => schedule().props.onCellPress(schedule().props.lane, Date.parse('2026-01-07T02:00:00Z')));
    assert.deepEqual(roster().props.windowSpec, {
      span: 'day', anchorDate: '2026-01-06', timezone: 'America/Chicago',
    });
    assert.equal(header('Show Monday, Jan 5').props.accessibilityState.selected, false);
    assert.equal(header('Show Tuesday, Jan 6').props.accessibilityState.selected, true);
    act(() => header('Show Thursday, Jan 8').props.onPress());
    assert.equal(roster().props.windowSpec.anchorDate, '2026-01-08');
    assert.equal(header('Show Thursday, Jan 8').props.accessibilityState.selected, true);
    assert.ok(header('Show Thursday, Jan 8').props.className.includes('bg-background'));
    act(() => tree.root.findByType(SpanChips).props.onChange('week'));
    const weekBounds = schedule().props.windowSpec;
    act(() => header('Show Friday, Jan 9').props.onPress());
    assert.deepEqual(roster().props.windowSpec, {
      span: 'week', anchorDate: '2026-01-09', timezone: 'America/Chicago',
    });
    const { windowFor } = await import('react-native-roster/core');
    assert.deepEqual(windowFor(roster().props.windowSpec), windowFor(weekBounds));
    act(() => tree.root.findByType(ZoneChips).props.onChange('Asia/Tokyo'));
    act(() => schedule().props.onCellPress(schedule().props.lane, Date.parse('2026-01-06T23:00:00Z')));
    assert.deepEqual(roster().props.windowSpec, {
      span: 'week', anchorDate: '2026-01-07', timezone: 'Asia/Tokyo',
    });
    assert.equal(tree.root.findByType(WeekSchedule).props.focusDate, '2026-01-07');
    assert.equal(tree.root.findByType('TextInput').props.placeholderTextColor, MUTED_FOREGROUND_HEX.light);
    scheme = 'dark';
    act(() => tree.root.findByType('TextInput').props.onChangeText('a'));
    assert.equal(tree.root.findByType('TextInput').props.placeholderTextColor, MUTED_FOREGROUND_HEX.dark);
    act(() => tree.root.findByType('TextInput').props.onChangeText('nobody-matches-this-query'));
    assert.equal(tree.root.findAllByType(Roster).length, 0);
    assert.equal(tree.root.findAllByType('Text').filter(node => node.props.children === 'Nobody matches that filter.').length, 2);
    act(() => tree.root.findByType('TextInput').props.onChangeText(''));
    assert.equal(tree.root.findAllByType(Roster).length, 1);
    act(() => tree.unmount());
  `;
  const result = Bun.spawnSync(['bun', '-e', script], { cwd: process.cwd() });
  expect(result.stderr.toString()).not.toContain('Error');
  expect(result.exitCode).toBe(0);
});

it('clears lunch detail from the inspector when working hours or an event is pressed', () => {
  let model!: TeamRosterModel;
  function Probe() {
    model = useTeamRoster({ team });
    if (model.status !== 'ready') return null;
    return (
      <MemberInspector
        lane={model.weekLane}
        member={model.selectedMember}
        selection={model.selection}
        windowSpec={model.weekWindowSpec}
        focusDate={model.windowSpec.anchorDate}
        selectDate={model.selectDate}
      />
    );
  }
  const tree = render(<Probe />);
  const lane = model.lanes.find((item) =>
    item.layers[0]?.gaps?.some((gap) => gap.sources.some((source) => source.id.endsWith(':lunch'))),
  );
  if (!lane) throw new Error('Expected lunch lane');
  const geometry = layoutLane(lane, window, {
    orientation: 'horizontal',
    viewTimezone: 'America/Chicago',
    pxPerMinute: 1,
    rowHeight: 56,
  });
  const lunch = geometry.gapRects.find((rect) =>
    rect.sources.some((source) => source.id.endsWith(':lunch')),
  );
  const availability = geometry.rects.find((rect) => rect.layerId === 'availability');
  const event = geometry.rects.find((rect) => rect.layerId === 'events');
  if (!lunch || !availability || !event) throw new Error('Expected press geometry');
  for (const rect of [availability, event]) {
    act(() => model.selectGap(lunch, lane));
    expect(tree.root.findAllByType(TimeOffSelection)).toHaveLength(1);
    expect(JSON.stringify(tree.toJSON())).toContain('Lunch break');
    act(() => model.selectInterval(rect, lane));
    if (model.status !== 'ready') throw new Error('Expected ready roster');
    expect(model.selection).toEqual({ kind: 'none', member: memberMeta(lane).member });
    expect(tree.root.findAllByType(TimeOffSelection)).toHaveLength(0);
    expect(tree.root.findAllByType(NoSelection)).toHaveLength(1);
    expect(JSON.stringify(tree.toJSON())).not.toContain('Lunch break');
  }
});

it('identifies time off by source id suffix rather than source kind', () => {
  expect(timeOffNote({ kind: 'rule', id: 'host:hours' })).toBeUndefined();
  for (const suffix of ['unknown', '__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
    const source = { kind: 'date', id: `host:${suffix}` };
    expect(timeOffNote(source)).toBeUndefined();
    const input = inputFor([]);
    const tree = render(
      <TimeOffGap {...input} rect={{ ...input.rect, width: 240, sources: [source] }} />,
    );
    expect(JSON.stringify(tree.toJSON())).toContain('Out of office');
  }
  expect(timeOffNote({ kind: 'date', id: 'host:lunch' })).toBe('Lunch break');
  expect(timeOffNote({ kind: 'rule', id: 'host:pto', label: 'Vacation' })).toBe('Vacation');
  expect(timeOffNote({ kind: 'date', id: 'host:pto' })).toBe('Out of office');
  expect(timeOffNote(undefined)).toBeUndefined();
});

it('generates deterministic varied attendance for non-numeric host member ids', () => {
  const original = team.members[0];
  if (!original) throw new Error('Expected member');
  const host = {
    ...original,
    id: 'host-alex',
    timezone: 'America/Chicago',
    workdays: [...original.workdays],
    hours: { start: 9, end: 17 },
  };
  const week = windowFor({ span: 'week', anchorDate: '2026-01-05', timezone: host.timezone });
  const generated = eventsFor(host, week, [host], week.end + 86400000);
  expect(generated.length).toBeGreaterThan(0);
  expect(eventsFor(host, week, [host], week.end + 86400000)).toEqual(generated);
  expect(
    generated.some((event) =>
      event.facts.some((fact) => fact.arrival !== event.start || fact.departure !== event.end),
    ),
  ).toBe(true);
  for (const event of generated) {
    for (const fact of event.facts) {
      expect(Number.isFinite(fact.arrival)).toBe(true);
      expect(Number.isFinite(fact.departure)).toBe(true);
    }
  }
});

it('returns an empty model for an unmatched query and restores the roster when cleared', () => {
  let model!: TeamRosterModel;
  function Probe() {
    model = useTeamRoster({ team });
    return null;
  }
  render(<Probe />);
  act(() => model.setQuery('nobody-matches-this-query'));
  expect(model.status).toBe('empty');
  expect(model.lanes).toEqual([]);
  expect(model.query).toBe('nobody-matches-this-query');
  act(() => model.setQuery(''));
  expect(model.status).toBe('ready');
  expect(model.lanes).toHaveLength(team.members.length);
});

it('selects a cell for its member and renders the slot in the view timezone', () => {
  let model!: TeamRosterModel;
  function Probe() {
    model = useTeamRoster({ team });
    if (model.status !== 'ready') return null;
    return (
      <MemberInspector
        lane={model.weekLane}
        member={model.selectedMember}
        selection={model.selection}
        windowSpec={model.weekWindowSpec}
        focusDate={model.windowSpec.anchorDate}
        selectDate={model.selectDate}
      />
    );
  }
  const tree = render(<Probe />);
  const lane = model.lanes[1];
  if (!lane) throw new Error('Expected second lane');
  const time = window.start + 3600000;
  act(() => model.selectCell(lane, time));
  if (model.status !== 'ready') throw new Error('Expected ready roster');
  expect(model.selectedLane.id).toBe(lane.id);
  expect(model.selection).toEqual({ kind: 'slot', member: memberMeta(lane).member, time });
  expect(tree.root.findAllByType(SlotSelection)).toHaveLength(1);
  const output = JSON.stringify(tree.toJSON());
  expect(output).toContain('Open slot');
  expect(output).toContain(dayLabel(time, model.timezone));
  expect(output).toContain(timeLabel(time, model.timezone));
  expect(output).toContain('Snapped to the hour.');
  act(() => model.selectMember(lane.id));
  expect(tree.root.findAllByType(SlotSelection)).toHaveLength(0);
});

it('suppresses the inspector system-clock line even when that clock falls within its week', () => {
  const clock = spyOn(Date, 'now').mockReturnValue(now + 3600000);
  try {
    const lane = lanes[0];
    if (!lane) throw new Error('Expected lane');
    const spec = { span: 'week' as const, anchorDate: '2026-01-05', timezone: 'America/Chicago' };
    const tree = render(
      <WeekSchedule
        lane={lane}
        windowSpec={spec}
        focusDate={spec.anchorDate}
        selectDate={() => {}}
      />,
    );
    act(() =>
      tree.root
        .find((node) => typeof node.props.onLayout === 'function')
        .props.onLayout({
          nativeEvent: { layout: { width: 380, height: 600, x: 0, y: 0 } },
        }),
    );
    expect(clock).toHaveBeenCalled();
    expect(Date.now()).not.toBe(now);
    const line = tree.root.findByType(WeekNowLine);
    expect(line.props.y).toBeGreaterThan(0);
    expect(line.children).toEqual([]);
    expect(JSON.stringify(tree.toJSON())).not.toContain('bg-rose-500');
  } finally {
    clock.mockRestore();
  }
});

it('dispatches availability and custom schedule layers to the member band', () => {
  const input = inputFor([]);
  for (const role of ['availability', 'custom'] as const) {
    const tree = render(<TeamScheduleInterval {...input} layer={{ ...input.layer, role }} />);
    expect(tree.root.findAllByType(AvailabilityBand)).toHaveLength(1);
    expect(tree.root.findAllByProps({ testID: 'team-schedule-event' })).toHaveLength(0);
  }
});
