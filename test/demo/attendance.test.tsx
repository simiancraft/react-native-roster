/// <reference types="nativewind/types" />
import '../support/native-host';
import { afterEach, describe, expect, it } from 'bun:test';
import { Pressable } from 'react-native';
import { type IntervalDetailInput, type IntervalInput, Roster } from 'react-native-roster';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AttendancePanel } from '../../demo/components/attendance';
import type {
  Attendance,
  AttendanceStatus,
} from '../../demo/components/attendance/attendance.types';
import { AttendanceIntervalDetail } from '../../demo/components/attendance/parts/interval-detail';
import { AttendanceModeToggle } from '../../demo/components/attendance/parts/mode-toggle';
import { AttendanceApartNotice } from '../../demo/components/attendance/parts/notice';
import { PresenceBar } from '../../demo/components/attendance/parts/presence-bar';
import { TogetherBlock } from '../../demo/components/attendance/parts/together-block';
import { useAttendance } from '../../demo/components/attendance/use-attendance';
import {
  attendanceMeta,
  attendanceMinutes,
} from '../../demo/components/attendance/utils/attendance';
import { clockLabel, dateLabel, offsetLabel } from '../../demo/components/attendance/utils/format';
import {
  collapse,
  deadTime,
  overlap,
  togetherFor,
} from '../../demo/components/attendance/utils/overlap';
import { statusFor } from '../../demo/components/attendance/utils/status';
import { attendanceFixtures } from '../fixtures/attendance';

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

for (const [index, attendance] of attendanceFixtures.entries()) {
  describe(attendance.id, () => {
    it('intersects everyone and follows each designated anchor', () => {
      const together = togetherFor(attendance.attendees, { kind: 'everyone' });
      const expected = [90, 65, 0][index] ?? 0;
      expect(together ? (together.end - together.start) / 60_000 : 0).toBe(expected);
      if (index === 1)
        expect(together).toEqual({
          start: attendance.plan.start + 600_000,
          end: attendance.plan.end - 900_000,
        });
      for (const attendee of attendance.attendees) {
        expect(
          togetherFor(attendance.attendees, { kind: 'anchor', attendeeId: attendee.id }),
        ).toEqual(collapse(attendee.presence));
        const presence = collapse(attendee.presence);
        if (!presence) throw new Error('Expected presence');
        const dead = deadTime(presence, together);
        const shared = together && overlap([presence, together]);
        const total = presence.end - presence.start;
        expect(dead.waiting + dead.lingering).toBe(
          total - (shared ? shared.end - shared.start : 0),
        );
      }
    });

    it('derives exact layer bounds, coverage, and versions for both modes', () => {
      let model!: ReturnType<typeof useAttendance>;
      function Hook() {
        model = useAttendance(attendance);
        return null;
      }
      render(<Hook />);
      expect(model.status).toBe(index === 2 ? 'apart' : 'together');
      for (const [i, lane] of model.lanes.entries()) {
        const attendee = attendance.attendees[i];
        expect(lane.layers.map((layer) => layer.id)).toEqual(
          index === 2 ? ['plan', 'presence'] : ['plan', 'presence', 'together'],
        );
        expect(lane.layers.map((layer) => [layer.role, layer.z])).toEqual(
          index === 2
            ? [
                ['custom', 0],
                ['availability', 1],
              ]
            : [
                ['custom', 0],
                ['availability', 1],
                ['booking', 2],
              ],
        );
        expect(lane.layers[0]?.intervals[0]).toMatchObject(attendance.plan);
        expect(lane.layers[1]?.intervals[0]).toMatchObject(
          collapse(attendee?.presence ?? []) ?? {},
        );
        const meta = attendanceMeta(lane);
        if (!meta.presence) throw new Error('Expected presence');
        expect(meta.minutes.present).toBe((meta.presence.end - meta.presence.start) / 60_000);
        expect(meta.minutes.together).toBe([90, 65, 0][index] ?? 0);
        expect(meta.minutes.dead).toBe(meta.minutes.present - meta.minutes.together);
      }
      let previous = model.lanes.map((lane) => lane.version);
      for (const anchor of attendance.attendees) {
        const anchorPresence = collapse(anchor.presence);
        if (!anchorPresence) throw new Error('Expected anchor presence');
        act(() => model.chooseMode({ kind: 'anchor', attendeeId: anchor.id }));
        expect(model.status).toBe('together');
        for (const [i, lane] of model.lanes.entries()) {
          expect(lane.version).not.toBe(previous[i]);
          expect(lane.layers[2]?.intervals[0]).toMatchObject(anchorPresence);
          const meta = attendanceMeta(lane);
          if (!meta.presence) throw new Error('Expected presence');
          const shared = overlap([meta.presence, anchorPresence]);
          expect(meta.minutes.together).toBe(shared ? (shared.end - shared.start) / 60_000 : 0);
          expect(meta.minutes.dead).toBeGreaterThanOrEqual(0);
          const expectedStatuses: readonly (readonly AttendanceStatus[])[] = [
            ['on-time', 'on-time', 'on-time'],
            ['on-time', 'late', 'left-early'],
            anchor.id === 'ada' ? ['left-early', 'missed'] : ['missed', 'late'],
          ] as const;
          const expectedStatus = expectedStatuses[index]?.[i];
          if (!expectedStatus) throw new Error('Expected status');
          expect(meta.status).toBe(expectedStatus);
        }
        previous = model.lanes.map((lane) => lane.version);
      }
      act(() => model.chooseMode({ kind: 'everyone' }));
      expect(model.status).toBe(index === 2 ? 'apart' : 'together');
      expect(model.lanes[0]?.version).not.toBe(previous[0]);
    });

    it('mounts the actual panel geometry and renders details for every layer', () => {
      const tree = render(<AttendancePanel attendance={attendance} />);
      for (const node of tree.root.findAll(
        (node) => typeof node.type === 'string' && node.props.onLayout,
      )) {
        act(() => node.props.onLayout({ nativeEvent: { layout: { width: 440, height: 168 } } }));
      }
      expect(tree.root.findAllByType(AttendanceApartNotice)).toHaveLength(index === 2 ? 1 : 0);
      const blocks = tree.root.findAllByType(TogetherBlock);
      expect(blocks).toHaveLength(index === 2 ? 0 : attendance.attendees.length);
      expect(tree.root.findAllByType(PresenceBar)).toHaveLength(attendance.attendees.length);
      if (blocks.length) {
        expect(new Set(blocks.map((block) => block.props.rect.x)).size).toBe(1);
        expect(new Set(blocks.map((block) => block.props.rect.width)).size).toBe(1);
        expect(blocks.every((block) => block.props.rect.height === 48)).toBe(true);
      }
      const roster = tree.root.findByType(Roster);
      for (const lane of roster.props.lanes as IntervalDetailInput['lane'][]) {
        for (const layer of lane.layers) {
          const bounds = layer.intervals[0];
          if (!bounds) throw new Error('Expected one interval');
          const input: IntervalDetailInput = {
            lane,
            layer,
            ...bounds,
            highlighted: false,
            viewTimezone: 'America/Chicago',
            rect: {
              x: 0,
              y: 0,
              width: 180,
              height: 48,
              z: layer.z,
              layerId: layer.id,
              sources: bounds.sources,
            },
          };
          const detail = render(<AttendanceIntervalDetail {...input} />);
          const json = JSON.stringify(detail.toJSON());
          expect(json).toContain(`attendance-detail-${layer.id}`);
          expect(json).toContain(clockLabel(bounds.start, input.viewTimezone));
          expect(json).toContain(clockLabel(bounds.end, input.viewTimezone));
          if (layer.id !== 'plan') expect(json).toContain('min dead time');
          expect(json).toContain(dateLabel(attendance.plan.start, input.viewTimezone));
          if (layer.id === 'together') expect(json).toContain(attendanceMeta(lane).attendee.name);
        }
      }
      const first = tree.root.findAllByType(PresenceBar)[0];
      if (!first) throw new Error('Expected presence');
      const narrow = render(
        <PresenceBar
          {...(first.props as IntervalInput)}
          rect={{ ...first.props.rect, width: 20 }}
        />,
      );
      expect(JSON.stringify(narrow.toJSON())).not.toContain('attendance-waiting');
      expect(narrow.root.findAll((node) => String(node.type) === 'Text')).toHaveLength(0);
    });
  });
}

it('handles touching, absent, and disjoint overlap without negative dead time', () => {
  expect(overlap([])).toBeNull();
  expect(deadTime({ start: 30, end: 40 }, { start: 0, end: 20 })).toEqual({
    waiting: 0,
    lingering: 10,
  });
  expect(
    overlap([
      { start: 0, end: 10 },
      { start: 10, end: 20 },
    ]),
  ).toBeNull();
  expect(deadTime({ start: 0, end: 20 }, { start: 5, end: 15 })).toEqual({
    waiting: 5,
    lingering: 5,
  });
  expect(deadTime({ start: 0, end: 20 }, null)).toEqual({ waiting: 20, lingering: 0 });
  expect(() => togetherFor([], { kind: 'anchor', attendeeId: 'missing' })).toThrow('anchor');
  expect(
    attendanceMinutes({
      availabilityMinutes: 40,
      bookingMinutes: 90,
      availabilityMinusBookingMinutes: 0,
    }),
  ).toEqual({ present: 40, together: 40, dead: 0 });
});

it('derives every attendance status and formats offsets and view zones', () => {
  const plan = { start: 10, end: 20 };
  expect(statusFor(plan, plan, plan)).toBe('on-time');
  expect(statusFor({ start: 11, end: 20 }, plan, plan)).toBe('late');
  expect(statusFor({ start: 10, end: 19 }, plan, plan)).toBe('left-early');
  expect(statusFor({ start: 11, end: 19 }, plan, plan)).toBe('late-and-left-early');
  expect(statusFor({ start: 20, end: 30 }, plan, plan)).toBe('missed');
  expect(statusFor(plan, plan, null)).toBe('missed');
  expect(clockLabel(Date.UTC(2026, 0, 5, 7), 'UTC')).toBe('07:00');
  expect(clockLabel(Date.UTC(2026, 0, 5, 7), 'America/Chicago')).toBe('01:00');
  expect(offsetLabel(600_000, 0)).toBe('10 min late');
  expect(offsetLabel(0, 600_000)).toBe('10 min early');
  expect(offsetLabel(0, 0)).toBe('on plan');
});

it('collapses unordered, overlapping, and disjoint segments, or an empty list', () => {
  expect(collapse([])).toBeNull();
  expect(
    collapse([
      { start: 20, end: 30 },
      { start: 0, end: 10 },
    ]),
  ).toEqual({ start: 0, end: 30 });
  expect(
    collapse([
      { start: 5, end: 20 },
      { start: 0, end: 10 },
    ]),
  ).toEqual({ start: 0, end: 20 });
  expect(
    collapse([
      { start: 0, end: 10 },
      { start: 20, end: 30 },
    ]),
  ).toEqual({ start: 0, end: 30 });
});

it('keeps a rejoining attendee in one bar and scales both dead-time regions to the rect', () => {
  const attendance = attendanceFixtures[1];
  if (!attendance) throw new Error('Expected workshop');
  expect(attendance.attendees[2]?.presence).toHaveLength(2);
  const tree = render(<AttendancePanel attendance={attendance} />);
  const roster = tree.root.findByType(Roster);
  const lanes = roster.props.lanes as IntervalDetailInput['lane'][];
  expect(lanes[2]?.layers.find((layer) => layer.id === 'presence')?.intervals).toHaveLength(1);
  for (const lane of lanes) {
    const layer = lane.layers.find((layer) => layer.id === 'presence');
    const interval = layer?.intervals[0];
    if (!layer || !interval) throw new Error('Expected presence');
    const { presence, together } = attendanceMeta(lane);
    if (!presence) throw new Error('Expected collapsed presence');
    const dead = deadTime(presence, together);
    for (const width of [180, 900]) {
      const bar = render(
        <PresenceBar
          lane={lane}
          layer={layer}
          highlighted={false}
          rect={{
            x: 0,
            y: 8,
            width,
            height: 32,
            z: 1,
            layerId: layer.id,
            sources: interval.sources,
          }}
        />,
      );
      for (const kind of ['waiting', 'lingering'] as const) {
        const region = bar.root.findAll(
          (node) => typeof node.type === 'string' && node.props.testID === `attendance-${kind}`,
        )[0];
        const expected = (width * dead[kind]) / (presence.end - presence.start);
        expect(region?.props.style.width).toBeCloseTo(expected);
        if (expected >= 40)
          expect(JSON.stringify(bar.toJSON())).toContain(`${dead[kind] / 60_000}`);
      }
    }
  }
});

it('labels fully missed presence dead and retains wait and linger around a together block', () => {
  for (const fixtureIndex of [2, 1]) {
    const attendance = attendanceFixtures[fixtureIndex];
    if (!attendance) throw new Error('Expected attendance fixture');
    const panel = render(<AttendancePanel attendance={attendance} />);
    const lanes = panel.root.findByType(Roster).props.lanes as IntervalDetailInput['lane'][];
    const labels = lanes.map((lane) => {
      const layer = lane.layers.find((layer) => layer.id === 'presence');
      const interval = layer?.intervals[0];
      if (!layer || !interval) throw new Error('Expected presence');
      const bar = render(
        <PresenceBar
          lane={lane}
          layer={layer}
          highlighted={false}
          rect={{
            x: 0,
            y: 8,
            width: 900,
            height: 32,
            z: 1,
            layerId: layer.id,
            sources: interval.sources,
          }}
        />,
      );
      return bar.root
        .findAll((node) => String(node.type) === 'Text')
        .map((node) => node.children.join(''));
    });
    if (fixtureIndex === 2) {
      expect(lanes.every((lane) => attendanceMeta(lane).together === null)).toBe(true);
      for (const captions of labels) {
        expect(captions).toContain('40m dead');
        expect(captions.some((caption) => /wait|linger/.test(caption))).toBe(false);
      }
    } else {
      expect(lanes.every((lane) => attendanceMeta(lane).together !== null)).toBe(true);
      expect(attendanceMeta(lanes[1] as IntervalDetailInput['lane']).status).toBe('late');
      expect(labels[0]).toContain('10m wait');
      expect(labels[0]).toContain('15m linger');
      expect(labels[1]).toContain('15m linger');
      expect(labels.flat().some((caption) => caption.includes('dead'))).toBe(false);
    }
  }
});

it('treats zero presence segments as a no-show in everyone and anchor modes', () => {
  const fixture = attendanceFixtures[0];
  if (!fixture) throw new Error('Expected standup');
  const attendance: Attendance = {
    ...fixture,
    id: 'no-show',
    attendees: [fixture.attendees[0], { id: 'absent', name: 'Absent attendee', presence: [] }],
  };
  const tree = render(<AttendancePanel attendance={attendance} />);
  for (const mode of [
    { kind: 'everyone' } as const,
    { kind: 'anchor', attendeeId: 'ada' } as const,
    { kind: 'anchor', attendeeId: 'absent' } as const,
  ]) {
    act(() => tree.root.findByType(AttendanceModeToggle).props.onChange(mode));
    const lanes = tree.root.findByType(Roster).props.lanes as IntervalDetailInput['lane'][];
    const lane = lanes[1];
    if (!lane) throw new Error('Expected no-show');
    expect(lane.layers.some((layer) => layer.id === 'presence')).toBe(false);
    expect(attendanceMeta(lane)).toMatchObject({
      presence: null,
      status: 'missed',
      minutes: { present: 0, together: 0, dead: 0 },
    });
    if (mode.kind === 'anchor' && mode.attendeeId === 'absent') {
      expect(lanes.every((lane) => lane.layers.every((layer) => layer.id !== 'together'))).toBe(
        true,
      );
      expect(tree.root.findAllByType(AttendanceApartNotice)).toHaveLength(1);
    }
  }
});

it('changes the panel mode through a mode toggle press', () => {
  const attendance = attendanceFixtures[2];
  if (!attendance) throw new Error('Expected missed case');
  const tree = render(<AttendancePanel attendance={attendance} />);
  const toggle = tree.root.findByType(AttendanceModeToggle);
  const anchor = toggle.findAllByType(Pressable)[1];
  if (!anchor) throw new Error('Expected anchor control');
  act(() => anchor.props.onPress());
  expect(tree.root.findByType(AttendanceModeToggle).props.mode).toEqual({
    kind: 'anchor',
    attendeeId: 'ada',
  });
  expect(tree.root.findAllByType(AttendanceApartNotice)).toHaveLength(0);
});

it('formats the plan date in the view timezone across a date boundary', () => {
  expect(dateLabel(Date.UTC(2026, 1, 2, 1), 'America/Chicago')).toBe('1 February 2026');
});
