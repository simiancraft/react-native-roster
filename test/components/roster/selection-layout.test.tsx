import { expect, it, mock } from 'bun:test';
import * as Popover from '@radix-ui/react-popover';
import type { ElementType } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { RosterSelectionPopover } from '../../../src/components/roster/selection/selection-layout';
import type { SelectionLayoutProps } from '../../../src/components/roster/selection/selection-layout.types';
import { RosterSelectionPopover as WebPopover } from '../../../src/components/roster/selection/selection-layout.web';
import { useRoster } from '../../../src/components/roster/use-roster';
import { rosterWindowSpec } from '../../fixtures/roster';
import { backHandlers } from '../../support/native-host';

it('keeps a native host mounted, positions and flips details, and dismisses on outside press and back', () => {
  let tree!: ReactTestRenderer;
  const onDismiss = mock();
  function Example({
    open = false,
    anchor = { x: 40, y: 50, width: 100, height: 48 },
  }: Partial<SelectionLayoutProps>) {
    const { scroll } = useRoster({ lanes: [], windowSpec: rosterWindowSpec });
    scroll.x.set(10);
    scroll.y.set(20);
    return (
      <RosterSelectionPopover
        open={open}
        anchor={anchor}
        anchorZone="body"
        contentZone="details"
        portalHost="layout-test"
        scroll={scroll}
        onDismiss={onDismiss}
      />
    );
  }
  act(() => {
    tree = create(<Example anchor={null} />);
  });
  expect(backHandlers.size).toBe(0);
  act(() =>
    tree.root
      .findAllByType('View' as ElementType)[0]
      ?.props.onLayout({ nativeEvent: { layout: { height: 300 } } }),
  );
  act(() => tree.update(<Example open />));
  expect(tree.root.findByType('AnimatedView' as ElementType).props.style[1]).toEqual({
    left: 40,
    top: 102,
    transform: [{ translateX: -10 }, { translateY: -20 }],
  });
  act(() =>
    tree.root
      .findByProps({ accessibilityRole: 'summary' })
      .props.onLayout({ nativeEvent: { layout: { height: 250 } } }),
  );
  expect(tree.root.findByType('AnimatedView' as ElementType).props.style[1].top).toBe(-204);
  act(() => tree.root.findByType('Pressable' as ElementType).props.onPress());
  expect(onDismiss).toHaveBeenCalledTimes(1);
  act(() => {
    for (const handler of backHandlers) expect(handler()).toBe(true);
  });
  expect(onDismiss).toHaveBeenCalledTimes(2);
  act(() => tree.update(<Example open anchor={null} />));
  expect(tree.root.findAllByType('Pressable' as ElementType)).toHaveLength(0);
  act(() => tree.update(<Example />));
  expect(backHandlers.size).toBe(0);
  act(() => tree.unmount());
});

it('uses Radix dismissal and a noninteractive translated web anchor', () => {
  let tree!: ReactTestRenderer;
  const onDismiss = mock();
  function Example({ anchor = null }: Partial<SelectionLayoutProps>) {
    const { scroll } = useRoster({ lanes: [], windowSpec: rosterWindowSpec });
    scroll.x.set(12);
    scroll.y.set(24);
    return (
      <WebPopover
        open={false}
        anchor={anchor}
        anchorZone="body"
        contentZone={null}
        portalHost="unused"
        scroll={scroll}
        onDismiss={onDismiss}
      />
    );
  }
  act(() => {
    tree = create(<Example />);
  });
  expect(tree.root.findByType('div').props.style.pointerEvents).toBe('none');
  act(() => tree.root.findByType(Popover.Root).props.onOpenChange(true));
  expect(onDismiss).not.toHaveBeenCalled();
  act(() => tree.root.findByType(Popover.Root).props.onOpenChange(false));
  expect(onDismiss).toHaveBeenCalledTimes(1);
  act(() => tree.update(<Example anchor={{ x: 30, y: 40, width: 100, height: 48 }} />));
  expect(tree.root.findByType('div').props.style).toMatchObject({ left: 30, top: 88 });
  const overlays = tree.root.findAllByType('AnimatedView' as ElementType);
  expect(overlays[0]?.props.style[1].transform).toEqual([{ translateX: -12 }]);
  expect(overlays[1]?.props.style.transform).toEqual([{ translateY: -24 }]);
  act(() => tree.unmount());
});
