import '../../support/native-host';
import { afterEach, describe, expect, it } from 'bun:test';
import { createElement, type ElementType } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { PlotStack, type PlotStackProps } from '../../../src/components/layers/plot-stack';

const trees: ReactTestRenderer[] = [];
function render(input: Partial<PlotStackProps> = {}) {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      createElement(PlotStack, {
        width: 120,
        height: 240,
        overlayZ: 9,
        gridZone: createElement('grid-sentinel'),
        marksZone: createElement('marks-sentinel'),
        overlayZone: createElement('overlay-sentinel'),
        ...input,
      }),
    );
  });
  trees.push(tree);
  return tree;
}

afterEach(() => {
  for (const tree of trees.splice(0)) act(() => tree.unmount());
});

describe('PlotStack', () => {
  it('arranges bounded zones with pointer-transparent overlay stacking', () => {
    const tree = render();
    const [plot, overlay] = tree.root.findAllByType('View' as ElementType);
    expect(plot?.props.style).toEqual({ width: 120, height: 240 });
    expect(plot?.children.map((child) => (typeof child === 'string' ? child : child.type))).toEqual(
      ['grid-sentinel', 'marks-sentinel', 'View'],
    );
    expect(overlay?.props).toMatchObject({
      pointerEvents: 'none',
      style: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 9,
      },
    });
    expect(
      overlay?.children.map((child) => (typeof child === 'string' ? child : child.type)),
    ).toEqual(['overlay-sentinel']);
  });

  it('clips to its dimensions when requested', () => {
    const plot = render({ clip: true }).root.findAllByType('View' as ElementType)[0];
    expect(plot?.props.style).toEqual({ width: 120, height: 240, overflow: 'hidden' });
  });

  it('omits the overlay wrapper when its zone is absent', () => {
    const tree = render({ overlayZone: null });
    expect(tree.root.findAllByType('View' as ElementType)).toHaveLength(1);
    const plot = tree.root.findByType('View' as ElementType);
    expect(plot.children.map((child) => (typeof child === 'string' ? child : child.type))).toEqual([
      'grid-sentinel',
      'marks-sentinel',
    ]);
  });
});
