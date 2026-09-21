import { beforeEach, describe, expect, it } from 'bun:test';
import { layerStyleCacheLimit, stylesFor } from '../../../src/components/layers/utils/styles';
import { clearCaches, type Layer } from '../../../src/core';
import { type RosterFixtureId, rosterFixtures } from '../../fixtures/roster';

describe('layer styles', () => {
  beforeEach(() => clearCaches());

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

  it('bounds retained styles and refreshes recency on hits', () => {
    const fixtureId: RosterFixtureId = 'single-lane';
    const layer = rosterFixtures[fixtureId].lanes[0]?.layers[0] as Layer;
    const recentLayer = { ...layer, id: 'recent' };
    const oldestLayer = { ...layer, id: 'oldest' };
    const recentStyles = stylesFor(recentLayer);
    const oldestStyles = stylesFor(oldestLayer);

    for (let index = 0; index < layerStyleCacheLimit - 2; index++) {
      stylesFor({ ...layer, id: `filler-${index}` });
    }

    expect(stylesFor(recentLayer)).toBe(recentStyles);
    stylesFor({ ...layer, id: 'overflow' });

    expect(stylesFor(recentLayer)).toBe(recentStyles);
    const regenerated = stylesFor(oldestLayer);
    expect(regenerated).not.toBe(oldestStyles);
    expect(regenerated).toEqual(oldestStyles);
  });

  it('clears loaded layer styles completely and repeatedly', () => {
    const fixtureId: RosterFixtureId = 'single-lane';
    const layer = rosterFixtures[fixtureId].lanes[0]?.layers[0] as Layer;
    const retained = stylesFor(layer);

    clearCaches();
    clearCaches();

    const regenerated = stylesFor(layer);
    expect(regenerated).not.toBe(retained);
    expect(regenerated.normal).not.toBe(retained.normal);
    expect(regenerated.highlighted).not.toBe(retained.highlighted);
    expect(regenerated).toEqual(retained);
  });
});
