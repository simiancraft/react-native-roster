import type { ElementType } from 'react';
import '../../support/native-host';
import { expect, it } from 'bun:test';
import { createElement } from 'react';

const { renderToString } = require('react-dom/server') as {
  renderToString: (node: import('react').ReactNode) => string;
};

import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Portal, PortalHost } from '../../../src/components/primitives/portal';

it('registers, updates, moves, and removes named nodes independently, with an empty server snapshot', () => {
  expect(renderToString(<PortalHost name="server" />)).toBe('');
  let tree!: ReactTestRenderer;
  function Example({ host = 'a', text = 'first', show = true }) {
    return (
      <>
        <PortalHost name="a" />
        <PortalHost name="b" />
        {show ? (
          <Portal hostName={host} name="one">
            {createElement('Text', null, text)}
          </Portal>
        ) : null}
        <Portal hostName="a" name="two">
          {createElement('Text', null, 'second')}
        </Portal>
      </>
    );
  }
  act(() => {
    tree = create(<Example />);
  });
  expect(tree.root.findAllByType('Text' as ElementType).map((node) => node.children)).toEqual([
    ['first'],
    ['second'],
  ]);
  act(() => tree.update(<Example host="b" text="changed" />));
  expect(tree.root.findAllByType('Text' as ElementType).map((node) => node.children)).toEqual([
    ['second'],
    ['changed'],
  ]);
  act(() => tree.update(<Example show={false} />));
  expect(tree.root.findAllByType('Text' as ElementType)).toHaveLength(1);
  act(() => tree.unmount());
  act(() => {
    tree = create(
      <>
        <PortalHost name="a" />
        <PortalHost name="b" />
      </>,
    );
  });
  expect(tree.toJSON()).toBeNull();
  act(() => tree.unmount());
});
