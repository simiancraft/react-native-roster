/// <reference types="nativewind/types" />
import '../support/native-host';
import { afterEach, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { Text, View } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Card, type CardProps } from '../../demo/components/ui/card';

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
