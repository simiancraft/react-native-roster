import { expect, it, mock } from 'bun:test';
import * as Popover from '@radix-ui/react-popover';
import type { ElementType } from 'react';
import { View } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { PlotStack } from '../../../src/components/layers/plot-stack';
import { Roster } from '../../../src/components/roster';
import { useRoster } from '../../../src/components/roster/use-roster';
import { SelectionSurface } from '../../../src/components/selection/selection-layout';
import type { SelectionSurfaceProps } from '../../../src/components/selection/selection-layout.types';
import { SelectionSurface as WebSurface } from '../../../src/components/selection/selection-layout.web';
import { rosterFixtures, rosterWindowSpec } from '../../fixtures/roster';
import { backHandlers } from '../../support/native-host';

it('keeps native selection chrome outside the Roster plot stack', () => {
  const fixture = rosterFixtures['interval-detail'];
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      <Roster
        lanes={fixture.lanes}
        windowSpec={fixture.windowSpec ?? rosterWindowSpec}
        intervalDetailComponent={fixture.zones.intervalDetailComponent}
      />,
    );
  });
  act(() => {
    for (const node of tree.root.findAllByType('View' as ElementType)) {
      node.props.onLayout?.({ nativeEvent: { layout: { width: 600, height: 240 } } });
    }
  });
  act(() =>
    tree.root.findByProps({ testID: 'roster-lane-one' }).props.onPress({
      nativeEvent: { locationX: 300, locationY: 20 },
    }),
  );
  const plot = tree.root.findByType(PlotStack);
  expect(plot.findAllByType('AnimatedView' as ElementType)).toHaveLength(0);
  expect(tree.root.findAllByType('AnimatedView' as ElementType).length).toBeGreaterThan(0);
  act(() => tree.unmount());
});

it('keeps a native host mounted, positions and flips details, and leaves the body unobstructed and dismisses on back', () => {
  let tree!: ReactTestRenderer;
  const onDismiss = mock();
  function Example({
    open = false,
    targetBounds = { x: 40, y: 50, width: 100, height: 48 },
  }: Partial<SelectionSurfaceProps>) {
    const { scroll } = useRoster({ lanes: [], windowSpec: rosterWindowSpec });
    scroll.x.set(10);
    scroll.y.set(20);
    return (
      <SelectionSurface
        open={open}
        targetBounds={targetBounds}
        anchorZone="body"
        contentZone="details"
        portalHost="layout-test"
        offsets={{ x: scroll.x, y: scroll.y }}
        onDismiss={onDismiss}
      />
    );
  }
  act(() => {
    tree = create(<Example targetBounds={null} />);
  });
  expect(backHandlers.size).toBe(0);
  act(() =>
    tree.root
      .findAllByType('View' as ElementType)[0]
      ?.props.onLayout({ nativeEvent: { layout: { width: 300, height: 300 } } }),
  );
  act(() => tree.update(<Example open />));
  expect(tree.root.findByType('AnimatedView' as ElementType).props.style[1]).toEqual({
    left: 30,
    top: 82,
  });
  act(() =>
    tree.root
      .findByProps({ accessibilityRole: 'summary' })
      .props.onLayout({ nativeEvent: { layout: { width: 200, height: 250 } } }),
  );
  function expectInside(left: number, top: number) {
    const position = tree.root.findByType('AnimatedView' as ElementType).props.style[1];
    expect(position).toEqual({ left, top });
    expect(position.left).toBeGreaterThanOrEqual(0);
    expect(position.left + 200).toBeLessThanOrEqual(300);
    expect(position.top).toBeGreaterThanOrEqual(0);
    expect(position.top + 250).toBeLessThanOrEqual(300);
  }
  // Neither below nor above fits, so use the viewport's top edge.
  expectInside(30, 0);
  act(() =>
    tree.update(<Example open targetBounds={{ x: 250, y: 290, width: 100, height: 48 }} />),
  );
  expectInside(100, 16);
  // Horizontal scrolling leaves the interval partly beyond the left edge.
  act(() => tree.update(<Example open targetBounds={{ x: 5, y: 50, width: 100, height: 48 }} />));
  expectInside(0, 0);
  expect(tree.root.findAllByType('Pressable' as ElementType)).toHaveLength(0);
  expect(
    tree.root.findByProps({ accessibilityRole: 'summary' }).props.onStartShouldSetResponder(),
  ).toBe(true);
  act(() => {
    for (const handler of backHandlers) expect(handler()).toBe(true);
  });
  expect(onDismiss).toHaveBeenCalledTimes(1);
  act(() => tree.update(<Example open targetBounds={null} />));
  expect(tree.root.findAllByType('Pressable' as ElementType)).toHaveLength(0);
  act(() => tree.update(<Example />));
  expect(backHandlers.size).toBe(0);
  act(() => tree.unmount());
});

it('uses Radix dismissal and a noninteractive translated web anchor', () => {
  let tree!: ReactTestRenderer;
  const onDismiss = mock();
  function Example({ open = false, targetBounds = null }: Partial<SelectionSurfaceProps>) {
    const { scroll } = useRoster({ lanes: [], windowSpec: rosterWindowSpec });
    scroll.x.set(12);
    scroll.y.set(24);
    return (
      <WebSurface
        open={open}
        targetBounds={targetBounds}
        anchorZone="body"
        contentZone={null}
        portalHost="unused"
        offsets={{ x: scroll.x, y: scroll.y }}
        onDismiss={onDismiss}
      />
    );
  }
  act(() => {
    tree = create(<Example />, {
      createNodeMock: (element) =>
        element.type === 'div'
          ? {
              contains: (target: unknown) =>
                target === 'body' ||
                (typeof document !== 'undefined' && target === document.activeElement),
            }
          : null,
    });
  });
  const content = tree.root.findByType(Popover.Portal).props.children.props;
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const originalHTMLElement = Object.getOwnPropertyDescriptor(globalThis, 'HTMLElement');
  class FocusTarget {
    focus = mock();
  }
  const lane = new FocusTarget();
  const detail = new FocusTarget();
  const documentDouble = { activeElement: lane as FocusTarget | null };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: documentDouble });
  Object.defineProperty(globalThis, 'HTMLElement', { configurable: true, value: FocusTarget });
  try {
    const preventCloseAutoFocus = mock();
    content.onOpenAutoFocus();
    documentDouble.activeElement = detail;
    content.onEscapeKeyDown();
    content.onCloseAutoFocus({ preventDefault: preventCloseAutoFocus });
    expect(preventCloseAutoFocus).toHaveBeenCalledTimes(1);
    expect(lane.focus).toHaveBeenLastCalledWith({ preventScroll: true });
    expect(detail.focus).not.toHaveBeenCalled();
    const secondLane = new FocusTarget();
    documentDouble.activeElement = secondLane;
    act(() =>
      tree.update(<Example open targetBounds={{ x: 30, y: 88, width: 100, height: 48 }} />),
    );
    content.onEscapeKeyDown();
    content.onCloseAutoFocus({ preventDefault: mock() });
    expect(secondLane.focus).toHaveBeenLastCalledWith({ preventScroll: true });
    expect(lane.focus).toHaveBeenCalledTimes(1);
    act(() => tree.update(<Example />));
    // A new open resets keyboard dismissal; outside pointer focus stays put.
    content.onOpenAutoFocus();
    content.onCloseAutoFocus({ preventDefault: preventCloseAutoFocus });
    expect(preventCloseAutoFocus).toHaveBeenCalledTimes(2);
    expect(lane.focus).toHaveBeenCalledTimes(1);
    expect(detail.focus).not.toHaveBeenCalled();
    documentDouble.activeElement = null;
    content.onOpenAutoFocus();
    content.onEscapeKeyDown();
    content.onCloseAutoFocus({ preventDefault: preventCloseAutoFocus });
    expect(preventCloseAutoFocus).toHaveBeenCalledTimes(3);
    expect(lane.focus).toHaveBeenCalledTimes(1);
  } finally {
    for (const [name, descriptor] of [
      ['document', originalDocument],
      ['HTMLElement', originalHTMLElement],
    ] as const) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
  const outside = tree.root.findByType(Popover.Portal).props.children.props.onInteractOutside;
  const preventDefault = mock();
  outside({ target: 'body', preventDefault });
  expect(preventDefault).toHaveBeenCalledTimes(1);
  outside({ target: 'outside', preventDefault });
  expect(preventDefault).toHaveBeenCalledTimes(1);
  expect(tree.root.findAllByType('div')[1]?.props.style.pointerEvents).toBe('none');
  act(() => tree.root.findByType(Popover.Root).props.onOpenChange(true));
  expect(onDismiss).not.toHaveBeenCalled();
  act(() => tree.root.findByType(Popover.Root).props.onOpenChange(false));
  expect(onDismiss).toHaveBeenCalledTimes(1);
  act(() => tree.update(<Example targetBounds={{ x: 30, y: 40, width: 100, height: 48 }} />));
  expect(tree.root.findAllByType('div')[1]?.props.style).toMatchObject({ left: 30, top: 88 });
  const overlays = tree.root.findAllByType('AnimatedView' as ElementType);
  expect(overlays[0]?.props.style[1].transform).toEqual([{ translateX: -12 }, { translateY: -24 }]);
  act(() => tree.unmount());
});

it('constrains oversized native details and scrolls them on both axes', () => {
  let tree!: ReactTestRenderer;
  function Example() {
    const { scroll } = useRoster({ lanes: [], windowSpec: rosterWindowSpec });
    return (
      <SelectionSurface
        open
        targetBounds={{ x: 290, y: 290, width: 100, height: 48 }}
        anchorZone="body"
        contentZone={<View style={{ width: 900, height: 800 }}>Large details</View>}
        portalHost="oversized-test"
        offsets={{ x: scroll.x, y: scroll.y }}
        onDismiss={() => {}}
      />
    );
  }
  act(() => {
    tree = create(<Example />);
  });
  act(() =>
    tree.root.findAllByType('View' as ElementType)[0]?.props.onLayout({
      nativeEvent: { layout: { width: 300, height: 200 } },
    }),
  );
  const summary = tree.root.findByProps({ accessibilityRole: 'summary' });
  expect(summary.props.style).toEqual({ maxWidth: 292, maxHeight: 192, flexShrink: 1 });
  const scrolls = summary.findAllByType('ScrollView' as ElementType);
  expect(scrolls).toHaveLength(2);
  expect(scrolls[0]?.props.horizontal).toBeUndefined();
  expect(scrolls[1]?.props.horizontal).toBe(true);
  expect(scrolls[1]?.findByType('View' as ElementType).props.style).toEqual({
    width: 900,
    height: 800,
  });
  expect(scrolls[0]?.props.style).toEqual(summary.props.style);
  // Preserve the inner content height so the outer view can scroll it vertically.
  expect(scrolls[1]?.props.style).toEqual({ maxWidth: 292, flexGrow: 0, flexShrink: 0 });
  act(() => summary.props.onLayout({ nativeEvent: { layout: { width: 292, height: 192 } } }));
  const styles = tree.root.findByType('AnimatedView' as ElementType).props.style;
  expect(styles[0]).toMatchObject({ maxWidth: 292, maxHeight: 192 });
  expect(styles[1]).toEqual({ left: 8, top: 0 });
  act(() => tree.unmount());
});

it('waits for viewport measurement with an open selection and then places details without negative offsets', () => {
  let tree!: ReactTestRenderer;
  function Example() {
    const { scroll } = useRoster({ lanes: [], windowSpec: rosterWindowSpec });
    scroll.x.set(100);
    scroll.y.set(100);
    return (
      <SelectionSurface
        open
        targetBounds={{ x: 0, y: 0, width: 100, height: 48 }}
        anchorZone="body"
        contentZone="details"
        portalHost="unmeasured-test"
        offsets={{ x: scroll.x, y: scroll.y }}
        onDismiss={() => {}}
      />
    );
  }
  act(() => {
    tree = create(<Example />);
  });
  expect(tree.root.findAllByType('AnimatedView' as ElementType)).toHaveLength(0);
  expect(tree.root.findAllByType('ScrollView' as ElementType)).toHaveLength(0);
  const measure = tree.root.findAllByType('View' as ElementType)[0]?.props.onLayout;
  act(() => measure({ nativeEvent: { layout: { width: 300, height: 0 } } }));
  expect(tree.root.findAllByType('AnimatedView' as ElementType)).toHaveLength(0);
  act(() => measure({ nativeEvent: { layout: { width: 300, height: 200 } } }));
  expect(tree.root.findByType('AnimatedView' as ElementType).props.style[1]).toEqual({
    left: 0,
    top: 0,
  });
  expect(tree.root.findAllByType('ScrollView' as ElementType)[1]?.props.children).toBe('details');
  act(() => tree.unmount());
});
