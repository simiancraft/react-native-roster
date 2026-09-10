import { describe, expect, it } from 'bun:test';
import { stylesFor } from '../../../src/components/layers/utils/styles';
import type { Layer } from '../../../src/core';
import { type RosterFixtureId, rosterFixtures } from '../../fixtures/roster';

describe('layer styles', () => {
  it('shares styles only for equal layer ids and canonical style contents', () => {
    const fixtureId: RosterFixtureId = 'single-lane';
    const layer = rosterFixtures[fixtureId].lanes[0]?.layers[0] as Layer;
    const same = { ...layer, style: { highlightColor: '#f59e0b', color: '#4f9478' } };
    expect(stylesFor(layer)).toBe(stylesFor(same));
    expect(stylesFor({ ...layer, id: 'different' })).not.toBe(stylesFor(layer));
    const changed = stylesFor({ ...layer, style: { color: '#fff', opacity: 0.4 } });
    expect(changed.normal.opacity).toBe(0.4);
    expect(changed.highlighted.backgroundColor).toBe('#fff');
  });
});
