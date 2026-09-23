/// <reference types="nativewind/types" />

import '../support/native-host';
import { afterEach, expect, it, mock } from 'bun:test';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import type { ScheduleWindowSpec } from '../../src';
import * as adapter from '../../src/adapters/rrule';
import type { WindowSpec } from '../../src/core';
import * as core from '../../src/core';
import { rosterFixtures } from '../fixtures/roster';
import { scheduleFixtures } from '../fixtures/schedule';
import { testPlatform } from '../support/native-host';

mock.module('react-native-roster/core', () => core);
mock.module('react-native-roster/rrule', () => adapter);

const { GalleryControls } = await import(
  '../../demo/components/gallery/fixtures/roster/parts/controls'
);
const { PerformanceControls } = await import(
  '../../demo/components/gallery/fixtures/roster/parts/performance-controls'
);
const { ScheduleControls } = await import(
  '../../demo/components/gallery/fixtures/schedule/parts/controls'
);
const { ZoneExamples } = await import(
  '../../demo/components/gallery/fixtures/schedule/parts/zone-examples'
);

const trees: ReactTestRenderer[] = [];

afterEach(() => {
  for (const tree of trees.splice(0)) act(() => tree.unmount());
  testPlatform.OS = 'ios';
  mock.restore();
});

it('labels every roster choice group and keeps one checked choice after activation', () => {
  testPlatform.OS = 'web';
  const tree = render(<RosterControlsHarness />);

  expect(groupLabels(tree)).toEqual(['Span', 'Minute step', 'Timezone', 'Sort']);
  for (const [groupLabel, choiceLabel] of [
    ['Span', 'day'],
    ['Minute step', '15 min'],
    ['Timezone', 'America/Chicago'],
    ['Sort', 'Sort: availability'],
  ] as const) {
    const group = radioGroup(tree, groupLabel);
    expect(checkedCount(group)).toBe(1);
    act(() => choice(group, choiceLabel).props.onPress());
    const updated = radioGroup(tree, groupLabel);
    expect(checkedCount(updated)).toBe(1);
    expect(choice(updated, choiceLabel).props['aria-checked']).toBe(true);
  }

  for (const label of ['Preset week', 'Previous', 'Next', 'Measure cold layout']) {
    const action = control(tree, label);
    expect(action.props.accessibilityRole).toBe('button');
    expect(action.props['aria-checked']).toBeUndefined();
    expect(action.props['aria-pressed']).toBeUndefined();
  }
});

it('labels every schedule choice group and keeps one checked choice after activation', () => {
  testPlatform.OS = 'web';
  const tree = render(<ScheduleControlsHarness />);

  expect(groupLabels(tree)).toEqual([
    'Zone style',
    'Span',
    'Minute step',
    'Scale',
    'Timezone',
    'View',
  ]);
  for (const [groupLabel, choiceLabel] of [
    ['Zone style', 'Zones: replacements'],
    ['Span', 'day'],
    ['Minute step', '15 min'],
    ['Scale', '32 px/hour'],
    ['Timezone', 'America/Chicago'],
    ['View', 'both'],
  ] as const) {
    const group = radioGroup(tree, groupLabel);
    expect(checkedCount(group)).toBe(1);
    act(() => choice(group, choiceLabel).props.onPress());
    const updated = radioGroup(tree, groupLabel);
    expect(checkedCount(updated)).toBe(1);
    expect(choice(updated, choiceLabel).props['aria-checked']).toBe(true);
  }

  for (const label of ['Previous', 'Next', 'Apia skipped date', 'Current week: now line']) {
    const action = control(tree, label);
    expect(action.props.accessibilityRole).toBe('button');
    expect(action.props['aria-checked']).toBeUndefined();
  }
});

function RosterControlsHarness() {
  const initialWindow: WindowSpec = { span: 'week', anchorDate: '2024-01-01', timezone: 'UTC' };
  const [windowSpec, setWindowSpec] = useState<WindowSpec>(initialWindow);
  const [minuteStep, setMinuteStep] = useState(60);
  const [sort, setSort] = useState<'label' | 'availability' | 'availabilityMinusBooking'>('label');
  const fixture = {
    ...rosterFixtures.empty,
    windowPresets: [{ label: 'Preset week', windowSpec: initialWindow }],
  };

  return (
    <GalleryControls
      fixture={fixture}
      windowSpec={windowSpec}
      setWindowSpec={setWindowSpec}
      setSpan={(span) =>
        setWindowSpec((current) => ({
          span,
          anchorDate: current.span === 'custom' ? '2024-01-01' : current.anchorDate,
          timezone: current.timezone,
        }))
      }
      setTimezone={(timezone) => setWindowSpec((current) => ({ ...current, timezone }))}
      minuteStep={minuteStep}
      setMinuteStep={setMinuteStep}
      sort={sort}
      setSort={setSort}
      nowZone={null}
      highlightZone={null}
      performanceZone={
        <PerformanceControls
          onMeasureColdLayout={() => {}}
          onChangeRule={() => {}}
          onChangeLaneTimezone={() => {}}
        />
      }
    />
  );
}

function ScheduleControlsHarness() {
  const fixture = scheduleFixtures['schedule-every-zone'];
  const [windowSpec, setWindowSpec] = useState<ScheduleWindowSpec>(fixture.windowSpec);
  const [zoneStyle, setZoneStyle] = useState<'defaults' | 'replacements'>('defaults');
  const [minuteStep, setMinuteStep] = useState(60);
  const [pxPerHour, setPxPerHour] = useState(48);
  const [view, setView] = useState<'roster' | 'schedule' | 'both'>('schedule');
  const navigate = (next: WindowSpec) => {
    if (next.span === 'day' || next.span === 'week') setWindowSpec({ ...next, span: next.span });
  };

  return (
    <ScheduleControls
      fixture={fixture}
      windowSpec={windowSpec}
      navigate={navigate}
      setSpan={(span) => setWindowSpec((current) => ({ ...current, span }))}
      minuteStep={minuteStep}
      setMinuteStep={setMinuteStep}
      pxPerHour={pxPerHour}
      setPxPerHour={setPxPerHour}
      setTimezone={(timezone) => setWindowSpec((current) => ({ ...current, timezone }))}
      view={view}
      setView={setView}
      zoneExamplesZone={
        <ZoneExamples
          zoneStyle={zoneStyle}
          onZoneStyle={setZoneStyle}
          windowSpec={windowSpec}
          navigate={navigate}
        />
      }
    />
  );
}

function groupLabels(tree: ReactTestRenderer) {
  return tree.root
    .findAllByProps({ accessibilityRole: 'radiogroup' })
    .map((group) => group.props.accessibilityLabel);
}

function radioGroup(tree: ReactTestRenderer, label: string) {
  return tree.root
    .findAllByType(View)
    .find(
      (node) =>
        node.props.accessibilityRole === 'radiogroup' && node.props.accessibilityLabel === label,
    ) as ReactTestInstance;
}

function checkedCount(group: ReactTestInstance) {
  return group.findAllByType(Pressable).filter((node) => node.props['aria-checked'] === true)
    .length;
}

function choice(group: ReactTestInstance, label: string) {
  return group.findAllByType(Pressable).find((node) => text(node) === label) as ReactTestInstance;
}

function control(tree: ReactTestRenderer, label: string) {
  return tree.root
    .findAllByType(Pressable)
    .find((node) => text(node) === label) as ReactTestInstance;
}

function text(node: ReactTestInstance) {
  return node.findByType(Text).props.children;
}

function render(element: React.ReactElement) {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  trees.push(tree);
  return tree;
}
