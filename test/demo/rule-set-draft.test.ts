import '../support/native-host';
import { expect, it, mock } from 'bun:test';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import * as adapter from '../../src/adapters/rrule';
import { expandRuleSet } from '../../src/adapters/rrule';
import { windowFor } from '../../src/core';
import { adapterFixtures } from '../fixtures/adapters';

mock.module('react-native-roster/rrule', () => adapter);
const { useRuleSetDraft } = await import(
  '../../demo/components/gallery/fixtures/roster/use-rule-set-draft'
);

it('retains applied geometry across invalid JSON and invalid rule fields, then applies valid edits', () => {
  const initial = adapterFixtures['adapter-weekly'].ruleSet;
  const window = windowFor(adapterFixtures['adapter-weekly'].windowSpec);
  let draft!: ReturnType<typeof useRuleSetDraft>;
  let tree!: ReactTestRenderer;
  function Hook() {
    draft = useRuleSetDraft(initial);
    return null;
  }
  act(() => {
    tree = create(createElement(Hook));
  });
  try {
    for (const text of ['{', 'null', '{"rules": {}}']) {
      act(() => draft.setText(text));
      expect(draft.parsed.status).toBe('invalid');
      act(() => draft.apply(window));
      expect(draft.applied).toBe(initial);
    }
    const invalid = { ...initial, rules: initial.rules.map((rule) => ({ ...rule, hourend: 2 })) };
    act(() => draft.setText(JSON.stringify(invalid)));
    expect(draft.parsed.status).toBe('valid');
    act(() => draft.apply(window));
    expect(draft.applied).toBe(initial);
    expect(draft.message).toContain('hours must satisfy');
    const edited = { ...initial, rules: initial.rules.map((rule) => ({ ...rule, hourend: 12 })) };
    act(() => draft.setText(JSON.stringify(edited)));
    act(() => draft.apply(window));
    expect(draft.applied).toEqual(edited);
    expect(draft.message).toBe('Rule set applied.');
    if (!draft.applied) throw new Error('Expected applied rule set');
    const result = expandRuleSet(draft.applied, window);
    expect(result.intervals).toHaveLength(5);
    expect(
      result.intervals.every((interval) => interval.end - interval.start === 3 * 3_600_000),
    ).toBe(true);
    act(() => draft.setText('{"rules":[],"dates":[]}'));
    act(() => draft.apply(window));
    expect(expandRuleSet(draft.applied, window).intervals).toEqual([]);
  } finally {
    act(() => tree.unmount());
  }
});
