/// <reference types="nativewind/types" />

import { afterEach, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { Pressable, Text, View } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
  Control,
  RadioControl,
  RadioGroup,
  ToggleControl,
} from '../../demo/components/gallery/fixtures/parts/control';
import { HighlightControls } from '../../demo/components/gallery/fixtures/roster/parts/highlight-controls';
import { ToolbarButton } from '../../demo/components/team-roster/parts/chips';
import { MemberLabel } from '../../demo/components/team-roster/parts/member-label';
import { teamFor } from '../../demo/components/team-roster/utils/team';
import { Card, type CardProps } from '../../demo/components/ui/card';
import { Toggle } from '../../demo/components/ui/toggle';
import type { Lane } from '../../src/core';
import { testPlatform } from '../support/native-host';

const trees: ReactTestRenderer[] = [];

function renderCard(props: Omit<CardProps, 'contentZone'> = {}) {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      <Card
        {...props}
        contentZone={<Text testID="card-content">Card content</Text>}
        testID="card"
      />,
    );
  });
  trees.push(tree);
  return tree;
}

afterEach(() => {
  for (const tree of trees.splice(0)) act(() => tree.unmount());
  testPlatform.OS = 'ios';
});

for (const [tone, expected] of [
  [undefined, ['rounded-xl', 'border', 'border-border', 'bg-card']],
  ['inset', ['rounded-xl', 'border', 'border-border', 'bg-background']],
  ['dashed', ['rounded-xl', 'border', 'border-dashed', 'border-grid-strong', 'bg-background']],
] as const) {
  it(`renders the ${tone ?? 'default'} Card tone with its literal classes`, () => {
    const tree = renderCard({ tone });
    const card = tree.root.findByType(View);

    expect(card.type).toBe(View);
    expect(card.props.className.split(' ')).toEqual(expected);
    expect(tree.root.findByProps({ testID: 'card-content' }).props.children).toBe('Card content');
  });
}

it('merges local layout classes without retaining conflicting defaults', () => {
  const card = renderCard({ className: 'rounded-lg gap-1 p-3' }).root.findByType(View);

  expect(card.props.className.split(' ')).toEqual([
    'border',
    'border-border',
    'bg-card',
    'rounded-lg',
    'gap-1',
    'p-3',
  ]);
});

it('keeps every Card variant class scanner-visible', () => {
  const source = readFileSync(
    new URL('../../demo/components/ui/card.tsx', import.meta.url),
    'utf8',
  );

  expect(source).toContain("default: 'border-border bg-card'");
  expect(source).toContain("inset: 'border-border bg-background'");
  expect(source).toContain("dashed: 'border-dashed border-grid-strong bg-background'");
});

it('exposes pressed and unpressed Toggle state as a button on web', () => {
  testPlatform.OS = 'web';
  const tree = render(<Toggle mode="pressed" pressed={false} onPress={() => {}} />);
  const toggle = tree.root.findByType(Pressable);

  expect(toggle.props.accessibilityRole).toBe('button');
  expect(toggle.props['aria-pressed']).toBe(false);
  expect(toggle.props.accessibilityState).toBeUndefined();

  act(() => tree.update(<Toggle mode="pressed" pressed={true} onPress={() => {}} />));
  expect(tree.root.findByType(Pressable).props['aria-pressed']).toBe(true);
});

it('exposes checked Toggle state through the native togglebutton role', () => {
  const toggle = render(
    <Toggle mode="pressed" pressed={true} onPress={() => {}} />,
  ).root.findByType(Pressable);

  expect(toggle.props.accessibilityRole).toBe('togglebutton');
  expect(toggle.props.accessibilityState).toEqual({ checked: true, disabled: undefined });
  expect(toggle.props['aria-pressed']).toBeUndefined();
});

it('exposes radio state on web and native', () => {
  testPlatform.OS = 'web';
  const web = render(<Toggle mode="radio" checked={false} onPress={() => {}} />).root.findByType(
    Pressable,
  );
  expect(web.props.accessibilityRole).toBe('radio');
  expect(web.props['aria-checked']).toBe(false);
  expect(web.props.accessibilityState).toBeUndefined();

  testPlatform.OS = 'ios';
  const native = render(<Toggle mode="radio" checked={true} onPress={() => {}} />).root.findByType(
    Pressable,
  );
  expect(native.props.accessibilityRole).toBe('radio');
  expect(native.props.accessibilityState).toEqual({ checked: true, disabled: undefined });
  expect(native.props['aria-checked']).toBeUndefined();
});

it('preserves disabled state and activation behavior', () => {
  let activations = 0;
  const enabled = render(
    <Toggle mode="pressed" pressed={false} onPress={() => activations++} />,
  ).root.findByType(Pressable);
  act(() => enabled.props.onPress());
  expect(activations).toBe(1);

  const disabled = render(
    <Toggle mode="pressed" pressed={false} disabled onPress={() => activations++} />,
  ).root.findByType(Pressable);
  expect(disabled.props.disabled).toBe(true);
  expect(disabled.props.accessibilityState).toEqual({ checked: false, disabled: true });
});

it('composes a programmatically named fixture radio group', () => {
  testPlatform.OS = 'web';
  const tree = render(
    <RadioGroup label="Minute step">
      <RadioControl label="15 min" checked onPress={() => {}} />
      <RadioControl label="30 min" checked={false} onPress={() => {}} />
    </RadioGroup>,
  );
  const group = tree.root.findByProps({ accessibilityRole: 'radiogroup' });
  const choices = group.findAllByType(Pressable);

  expect(group.props.accessibilityLabel).toBe('Minute step');
  expect(choices.map((choice) => choice.props.accessibilityRole)).toEqual(['radio', 'radio']);
  expect(choices.map((choice) => choice.props['aria-checked'])).toEqual([true, false]);
});

it('keeps fixture actions ordinary', () => {
  const action = render(<Control label="Next" onPress={() => {}} />).root.findByType(Pressable);
  expect(action.props.accessibilityRole).toBe('button');
  expect(action.props.accessibilityState).toBeUndefined();
  expect(action.props['aria-selected']).toBeUndefined();
  expect(action.props['aria-pressed']).toBeUndefined();
  expect(action.props['aria-checked']).toBeUndefined();
});

it('routes fixture now and highlight choices through pressed toggles', () => {
  testPlatform.OS = 'web';
  let nowActivations = 0;
  const now = render(
    <ToggleControl
      label="Now at window midpoint"
      pressed={false}
      onPress={() => nowActivations++}
    />,
  ).root.findByType(Pressable);
  expect(now.props['aria-pressed']).toBe(false);
  act(() => now.props.onPress());
  expect(nowActivations).toBe(1);

  const highlight = render(<HighlightControls active onHighlight={() => {}} onClear={() => {}} />);
  const controls = highlight.root.findAllByType(Pressable);
  expect(controls[0]?.props['aria-pressed']).toBe(true);
  expect(controls[1]?.props['aria-pressed']).toBeUndefined();
  expect(controls[1]?.props['aria-selected']).toBeUndefined();
});

it('uses pressed-toggle semantics for member selection and keeps toolbar actions ordinary', () => {
  const member = teamFor(1318, 1).members[0];
  if (!member) throw new Error('Expected one seeded member');
  const lane: Lane = {
    id: member.id,
    label: member.name,
    layers: [],
    meta: { member, events: [], now: 0 },
  };
  const memberLabel = render(
    <MemberLabel
      lane={lane}
      flag="none"
      complete
      viewTimezone="UTC"
      incompleteLabel="Partial hours"
      neverSetLabel="Never set"
      density="avatar"
      variant="selected"
      onPress={() => {}}
    />,
  ).root.findByType(Pressable);
  expect(memberLabel.props.accessibilityRole).toBe('togglebutton');
  expect(memberLabel.props.accessibilityState).toEqual({ checked: true, disabled: undefined });

  const toolbar = render(
    <ToolbarButton label="Previous" accessibilityLabel="Previous day" onPress={() => {}} />,
  ).root.findByType(Pressable);
  expect(toolbar.props.accessibilityRole).toBe('button');
  expect(toolbar.props.accessibilityState).toBeUndefined();
  expect(toolbar.props['aria-pressed']).toBeUndefined();
});

function render(element: React.ReactElement) {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  trees.push(tree);
  return tree;
}
