/// <reference types="nativewind/types" />
import '../support/native-host';
import { afterEach, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { Text, View } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ChipGroup } from '../../demo/components/team-roster/parts/chips';
import { TeamCorner } from '../../demo/components/team-roster/parts/header-cell';
import { Card, type CardProps } from '../../demo/components/ui/card';
import { Eyebrow, type EyebrowProps } from '../../demo/components/ui/eyebrow';

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
