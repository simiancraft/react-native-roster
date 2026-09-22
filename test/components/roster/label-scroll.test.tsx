import { expect, it, mock } from 'bun:test';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { labelWheelProps } from '../../../src/components/roster/parts/label-wheel';
import type { LabelWheelProps } from '../../../src/components/roster/parts/label-wheel.types';
import { labelWheelProps as webLabelWheelProps } from '../../../src/components/roster/parts/label-wheel.web';

function WebLabelScroll({ scroll }: { scroll: LabelWheelProps }) {
  return createElement('View', webLabelWheelProps(scroll));
}

it('routes wheel units to the current list and releases its listener', () => {
  const target = { scrollTop: 0, clientHeight: 400 };
  const scroll = { verticalRef: { current: null } } as unknown as LabelWheelProps;
  const node = { onwheel: null as null | ((input: Partial<WheelEvent>) => void) };
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(createElement(WebLabelScroll, { scroll }), {
      createNodeMock: () => node,
    });
  });
  const wheel = node.onwheel;
  if (!wheel) throw new Error('Missing wheel handler');
  const preventDefault = mock();
  wheel({ deltaY: 10, preventDefault });
  scroll.verticalRef.current = { getScrollableNode: () => target } as unknown as NonNullable<
    typeof scroll.verticalRef.current
  >;
  wheel({ deltaY: 10, ctrlKey: true, preventDefault });
  wheel({ deltaY: 0, deltaX: 10, preventDefault });
  expect(target.scrollTop).toBe(0);
  wheel({ deltaY: 2.5, deltaMode: 0, preventDefault });
  wheel({ deltaY: 2, deltaMode: 1, preventDefault });
  wheel({ deltaY: 1, deltaMode: 2, preventDefault });
  expect(target.scrollTop).toBe(434.5);
  wheel({ deltaY: -1, deltaMode: 1, preventDefault });
  expect(target.scrollTop).toBe(418.5);
  Object.defineProperty(target, 'scrollTop', { get: () => 0, set: () => {} });
  wheel({ deltaY: -10, preventDefault });
  expect(preventDefault).toHaveBeenCalledTimes(4);
  act(() => tree.unmount());
  expect(node.onwheel).toBeNull();
});

it('leaves native label input unchanged', () => {
  expect(labelWheelProps({ verticalRef: { current: null } })).toEqual({});
});
