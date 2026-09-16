import { expect, test } from 'bun:test';
import { hasSource } from '../../src/core';

test('hasSource matches kind and id independently of labels and object identity', () => {
  const sources = [{ kind: 'rule', id: 'one', label: 'Original' }];
  expect(hasSource(sources, { kind: 'rule', id: 'one', label: 'Renamed' })).toBe(true);
  expect(hasSource(sources, { kind: 'date', id: 'one' })).toBe(false);
  expect(hasSource(sources, { kind: 'rule', id: 'two' })).toBe(false);
  expect(hasSource(sources, undefined)).toBe(false);
  expect(hasSource([], { kind: 'rule', id: 'one' })).toBe(false);
});
