import '../../support/native-host';
import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { createElement, type ElementType } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { LayerStack } from '../../../src/components/layers/layer-stack';
import type {
  GapInput,
  IntervalInput,
  LayerStackInput,
} from '../../../src/components/layers/layers.types';
import type { Lane, Rect } from '../../../src/core';

const lane: Lane = {
  id: 'lane',
  label: 'Lane',
  layers: [
    {
      id: 'above',
      role: 'booking',
      z: 20,
      style: { color: 'red' },
      intervals: [],
    },
    {
      id: 'below',
      role: 'availability',
      z: 10,
      style: { color: 'green' },
      intervals: [],
    },
  ],
};

function rect(input: Partial<Rect> & Pick<Rect, 'layerId'>): Rect {
  return {
    x: 1,
    y: 2,
    width: 3,
    height: 4,
    z: 1,
    sources: [],
    ...input,
  };
}

const trees: ReactTestRenderer[] = [];
function render(input: Partial<LayerStackInput> = {}) {
  const element = createElement(LayerStack, {
    lane,
    rects: [],
    gapRects: [],
    press: mock(),
    boundsFor: () => ({
      start: Date.parse('2024-11-03T05:30:00Z'),
      end: Date.parse('2024-11-03T06:30:00Z'),
    }),
    viewTimezone: 'America/New_York',
    activateInterval: mock(),
    activateGap: mock(),
    intervalComponent: (props: IntervalInput) => createElement('interval-sentinel', props),
    gapComponent: (props: GapInput) => createElement('gap-sentinel', props),
    ...input,
  });
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  trees.push(tree);
  return tree;
}

afterEach(() => {
  for (const tree of trees.splice(0)) act(() => tree.unmount());
  mock.restore();
});

describe('LayerStack', () => {
  it('sorts layers, filters rects, and matches a fresh source identity', () => {
    const below = rect({
      layerId: 'below',
      sources: [{ kind: 'rule', id: 'shared', label: 'Stored label' }],
    });
    const above = rect({ layerId: 'above', x: 10 });
    const unrelated = rect({ layerId: 'other', x: 20 });
    const tree = render({
      rects: [above, unrelated, below],
      highlightSource: { kind: 'rule', id: 'shared', label: 'Fresh label' },
    });
    const intervals = tree.root.findAllByType('interval-sentinel' as ElementType);
    expect(intervals.map((node) => node.props.rect)).toEqual([below, above]);
    expect(intervals[0]?.props.rect).toBe(below);
    expect(intervals[0]?.props.layer).toBe(lane.layers[1]);
    expect(intervals[0]?.props).toMatchObject({
      lane,
      highlighted: true,
    });
    expect(intervals[1]?.props.highlighted).toBe(false);
  });

  it('keys horizontal, vertical, and equal-position split pieces without collisions', () => {
    const error = spyOn(console, 'error').mockImplementation(() => {});
    const samePosition = rect({ layerId: 'below', column: 1 });
    const tree = render({
      rects: [
        rect({ layerId: 'below', x: 1, y: 10 }),
        rect({ layerId: 'below', x: 2, y: 10 }),
        rect({ layerId: 'below', x: 10, y: 1, column: 0 }),
        rect({ layerId: 'below', x: 10, y: 2, column: 0 }),
        samePosition,
        { ...samePosition },
      ],
    });
    expect(tree.root.findAllByType('interval-sentinel' as ElementType)).toHaveLength(6);
    expect(error.mock.calls.some((call) => call.join(' ').includes('same key'))).toBe(false);
  });

  it('names and directly activates exact intervals and gaps once', () => {
    const activateInterval = mock();
    const activateGap = mock();
    const interval = rect({
      layerId: 'above',
      sources: [{ kind: 'rule', id: 'fallback-id', label: 'Named source' }],
    });
    const gap = rect({ layerId: 'below', x: 30, y: 40, width: 50, height: 60, z: 7 });
    const tree = render({
      rects: [interval],
      gapRects: [gap],
      activateInterval,
      activateGap,
    });
    const targets = tree.root.findAllByType('Pressable' as ElementType);
    expect(targets).toHaveLength(2);
    expect(targets.map((target) => target.props.accessibilityRole)).toEqual(['button', 'button']);
    const intervalTarget = targets.find((target) =>
      target.props.accessibilityLabel?.includes('booking interval'),
    );
    const gapTarget = targets.find((target) =>
      target.props.accessibilityLabel?.includes('removed time'),
    );
    expect(intervalTarget?.props.accessibilityLabel).toContain(
      'Lane: booking interval, Nov 3, 2024, 1:30 AM GMT-4 to Nov 3, 2024, 1:30 AM GMT-5, sources Named source',
    );
    expect(gapTarget?.props).toMatchObject({
      style: {
        position: 'absolute',
        left: 30,
        top: 40,
        width: 50,
        height: 60,
        zIndex: 7,
      },
    });
    expect(gapTarget?.props.accessibilityLabel).toContain('Lane: removed time');
    expect(tree.root.findByType('gap-sentinel' as ElementType).props).toMatchObject({
      rect: gap,
      layer: lane.layers[1],
      lane,
    });
    const stopPropagation = mock();
    intervalTarget?.props.onPress({ stopPropagation, nativeEvent: {} });
    gapTarget?.props.onPress({ stopPropagation, nativeEvent: {} });
    expect(stopPropagation).toHaveBeenCalledTimes(2);
    expect(activateInterval.mock.calls[0]?.slice(0, 2)).toEqual([interval, lane]);
    expect(activateGap.mock.calls[0]?.slice(0, 2)).toEqual([gap, lane]);
  });
});
