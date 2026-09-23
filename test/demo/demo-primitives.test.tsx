/// <reference types="nativewind/types" />

import { afterEach, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
  Control,
  RadioControl,
  RadioGroup,
  ToggleControl,
} from '../../demo/components/gallery/fixtures/parts/control';
import { HighlightControls } from '../../demo/components/gallery/fixtures/roster/parts/highlight-controls';
import { Chip, ChipGroup, ToolbarButton } from '../../demo/components/team-roster/parts/chips';
import { TeamCorner } from '../../demo/components/team-roster/parts/header-cell';
import { MemberLabel } from '../../demo/components/team-roster/parts/member-label';
import { teamFor } from '../../demo/components/team-roster/utils/team';
import { TONE_CLASSES } from '../../demo/components/team-roster/utils/tones';
import { Card, type CardProps } from '../../demo/components/ui/card';
import { Eyebrow, type EyebrowProps } from '../../demo/components/ui/eyebrow';
import { Toggle } from '../../demo/components/ui/toggle';
import type { Lane } from '../../src/core';
import { testPlatform } from '../support/native-host';

const trees: ReactTestRenderer[] = [];

function ChipGroupHarness() {
  const [selected, setSelected] = useState<'day' | 'week'>('day');
  return (
    <ChipGroup
      label="View"
      chipsZone={
        <>
          <Chip label="Day" selected={selected === 'day'} onPress={() => setSelected('day')} />
          <Chip label="Week" selected={selected === 'week'} onPress={() => setSelected('week')} />
        </>
      }
    />
  );
}

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

function renderEyebrow(props: Omit<EyebrowProps, 'children'> = {}) {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<Eyebrow {...props}>Eyebrow text</Eyebrow>);
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

for (const [size, expected] of [
  [
    undefined,
    ['font-medium', 'uppercase', 'text-muted-foreground', 'text-[11px]', 'tracking-wide'],
  ],
  [
    'compact',
    [
      'font-medium',
      'uppercase',
      'text-muted-foreground',
      'text-[9px]',
      'leading-3',
      'tracking-wider',
    ],
  ],
] as const) {
  it(`renders the ${size ?? 'default'} Eyebrow size with its literal classes`, () => {
    const eyebrow = renderEyebrow({ size }).root.findByType(Text);

    expect(eyebrow.props.className.split(' ')).toEqual(expected);
    expect(eyebrow.props.children).toBe('Eyebrow text');
  });
}

it('keeps every Eyebrow variant class scanner-visible', () => {
  const source = readFileSync(
    new URL('../../demo/components/ui/eyebrow.tsx', import.meta.url),
    'utf8',
  );

  expect(source).toContain("default: 'text-[11px] tracking-wide'");
  expect(source).toContain("compact: 'text-[9px] leading-3 tracking-wider'");
});

it('renders team roster captions through Eyebrow without changing their text', () => {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      <View>
        <TeamCorner label="People" count={4} density="full" />
        <ChipGroup label="Span" chipsZone={<Text>Week</Text>} />
      </View>,
    );
  });
  trees.push(tree);

  const captions = tree.root.findAllByType(Eyebrow);
  expect(captions).toHaveLength(2);
  expect(captions.map((caption) => caption.props.children)).toEqual(['People · 4', 'Span']);
  expect(captions[1]?.props.className).toBe('absolute -top-2 left-2 bg-background px-1');
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

it('labels team-roster chips as an exclusive radio group and activates a choice on web', () => {
  testPlatform.OS = 'web';
  const tree = render(<ChipGroupHarness />);
  const group = tree.root.findByProps({ accessibilityRole: 'radiogroup' });
  const choices = group.findAllByType(Pressable);

  expect(group.props.accessibilityLabel).toBe('View');
  expect(choices.map((choice) => choice.props.accessibilityRole)).toEqual(['radio', 'radio']);
  expect(choices.map((choice) => choice.props['aria-checked'])).toEqual([true, false]);

  act(() => choices[1]?.props.onPress());
  expect(group.findAllByType(Pressable).map((choice) => choice.props['aria-checked'])).toEqual([
    false,
    true,
  ]);
});

it('exposes the team-roster radio group and checked choices on native', () => {
  const tree = render(<ChipGroupHarness />);
  const group = tree.root.findByProps({ accessibilityRole: 'radiogroup' });
  const choices = group.findAllByType(Pressable);

  expect(group.props.accessibilityLabel).toBe('View');
  expect(choices.map((choice) => choice.props.accessibilityRole)).toEqual(['radio', 'radio']);
  expect(choices.map((choice) => choice.props.accessibilityState)).toEqual([
    { checked: true, disabled: undefined },
    { checked: false, disabled: undefined },
  ]);
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

for (const density of ['full', 'compact', 'avatar'] as const) {
  for (const variant of ['idle', 'selected'] as const) {
    it(`preserves the ${density} ${variant} MemberLabel classes through declared variants`, () => {
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
          density={density}
          variant={variant}
          onPress={() => {}}
        />,
      ).root.findByType(Pressable);
      const densityClasses = density === 'avatar' ? ['justify-center'] : ['gap-3', 'px-3'];
      const variantClasses =
        variant === 'selected'
          ? ['border-l-2', 'border-l-primary', 'bg-accent/70']
          : ['active:bg-accent/60'];

      expect(memberLabel.props.className.split(' ')).toEqual([
        'flex-1',
        'flex-row',
        'items-center',
        'border-b',
        'border-border',
        ...densityClasses,
        ...variantClasses,
      ]);
    });
  }
}

it('joins both MemberLabel avatar tone classes with cn', () => {
  const member = teamFor(1318, 1).members[0];
  if (!member) throw new Error('Expected one seeded member');
  const lane: Lane = {
    id: member.id,
    label: member.name,
    layers: [],
    meta: { member, events: [], now: 0 },
  };
  const tree = render(
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
  );
  const memberLabel = tree.root.findByType(Pressable);
  const avatar = tree.root
    .findAllByType(View)
    .find((view) => view.props.className?.includes('rounded-full'));
  const initials = tree.root
    .findAllByType(Text)
    .find((text) => text.props.children === member.initials);
  const tone = TONE_CLASSES[member.tone];

  expect(memberLabel.props.accessibilityRole).toBe('togglebutton');
  expect(memberLabel.props.accessibilityState).toEqual({ checked: true, disabled: undefined });
  expect(avatar?.props.className).toBe(
    `h-8 w-8 items-center justify-center rounded-full ${tone.avatar}`,
  );
  expect(initials?.props.className).toBe(`text-xs font-semibold ${tone.avatarText}`);

  const source = readFileSync(
    new URL('../../demo/components/team-roster/parts/member-label.tsx', import.meta.url),
    'utf8',
  );
  expect(source).toContain("cn('h-8 w-8 items-center justify-center rounded-full', tone.avatar)");
  expect(source).toContain("cn('text-xs font-semibold', tone.avatarText)");
});

it('keeps toolbar actions ordinary buttons without toggle or radio state', () => {
  const toolbar = render(
    <ToolbarButton label="Previous" accessibilityLabel="Previous day" onPress={() => {}} />,
  ).root.findByType(Pressable);
  expect(toolbar.props.accessibilityRole).toBe('button');
  expect(toolbar.props.accessibilityState).toBeUndefined();
  expect(toolbar.props['aria-selected']).toBeUndefined();
  expect(toolbar.props['aria-pressed']).toBeUndefined();
  expect(toolbar.props['aria-checked']).toBeUndefined();
});

function render(element: React.ReactElement) {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  trees.push(tree);
  return tree;
}
