import { beforeEach, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import * as root from '../../src';
import * as core from '../../src/core';
import {
  coverageCacheFor,
  coverageCacheLimit,
  layoutCacheFor,
  layoutCacheLimit,
  registerCacheClear,
} from '../../src/core/cache';
import type { Lane, Projection, ScopedCacheIdentity } from '../../src/core/types';

const window = { start: 0, end: 60_000 };
const projection: Projection = {
  orientation: 'horizontal',
  viewTimezone: 'UTC',
  pxPerMinute: 1,
  rowHeight: 40,
};

function lane(version: number): Lane {
  return {
    id: 'lane',
    label: 'Lane',
    version,
    layers: [
      {
        id: 'available',
        role: 'availability',
        z: 0,
        style: { color: 'green' },
        intervals: [{ start: 0, end: 60_000, sources: [{ kind: 'rule', id: 'rule' }] }],
      },
    ],
  };
}

beforeEach(() => {
  core.clearCaches();
  core.resetStats();
});

describe('bounded geometry caches', () => {
  it('bounds layout entries, refreshes hits, and recomputes equal evicted geometry', () => {
    const cacheIdentity: ScopedCacheIdentity = {};
    const first = core.layoutLane(lane(0), window, projection, cacheIdentity);
    const second = core.layoutLane(lane(1), window, projection, cacheIdentity);
    for (let version = 2; version < layoutCacheLimit; version++) {
      core.layoutLane(lane(version), window, projection, cacheIdentity);
    }

    expect(layoutCacheFor(cacheIdentity).size).toBe(layoutCacheLimit);
    expect(core.layoutLane(lane(0), window, projection, cacheIdentity)).toBe(first);
    core.layoutLane(lane(layoutCacheLimit), window, projection, cacheIdentity);
    expect(layoutCacheFor(cacheIdentity).size).toBe(layoutCacheLimit);
    expect(core.layoutLane(lane(0), window, projection, cacheIdentity)).toBe(first);
    const recomputed = core.layoutLane(lane(1), window, projection, cacheIdentity);
    expect(recomputed).not.toBe(second);
    expect(recomputed).toEqual(second);
    expect(layoutCacheFor(cacheIdentity).size).toBe(layoutCacheLimit);
  });

  it('bounds coverage entries, refreshes hits, and recomputes equal evicted coverage', () => {
    const cacheIdentity: ScopedCacheIdentity = {};
    const first = core.coverageFor(lane(0), window, cacheIdentity);
    const second = core.coverageFor(lane(1), window, cacheIdentity);
    for (let version = 2; version < coverageCacheLimit; version++) {
      core.coverageFor(lane(version), window, cacheIdentity);
    }

    expect(coverageCacheFor(cacheIdentity).size).toBe(coverageCacheLimit);
    expect(core.coverageFor(lane(0), window, cacheIdentity)).toBe(first);
    core.coverageFor(lane(coverageCacheLimit), window, cacheIdentity);
    expect(coverageCacheFor(cacheIdentity).size).toBe(coverageCacheLimit);
    expect(core.coverageFor(lane(0), window, cacheIdentity)).toBe(first);
    const recomputed = core.coverageFor(lane(1), window, cacheIdentity);
    expect(recomputed).not.toBe(second);
    expect(recomputed).toEqual(second);
    expect(coverageCacheFor(cacheIdentity).size).toBe(coverageCacheLimit);
  });
});

describe('complete cache clearing', () => {
  it('clears geometry repeatedly, preserves counters, and runs loaded-scope registrations', () => {
    const cacheIdentity: ScopedCacheIdentity = {};
    const geometry = core.layoutLane(lane(0), window, projection, cacheIdentity);
    const stats = { layout: core.layoutStats(), coverage: core.coverageStats() };
    let firstScopeClears = 0;
    let laterScopeClears = 0;
    const unregisterFirst = registerCacheClear(() => firstScopeClears++);

    core.clearCaches();
    core.clearCaches();
    expect(firstScopeClears).toBe(2);
    expect(core.layoutStats()).toEqual(stats.layout);
    expect(core.coverageStats()).toEqual(stats.coverage);
    expect(core.layoutLane(lane(0), window, projection, cacheIdentity)).not.toBe(geometry);

    const unregisterLater = registerCacheClear(() => laterScopeClears++);
    core.clearCaches();
    expect(firstScopeClears).toBe(3);
    expect(laterScopeClears).toBe(1);
    unregisterFirst();
    unregisterLater();
    core.clearCaches();
    expect(firstScopeClears).toBe(3);
    expect(laterScopeClears).toBe(1);
  });

  it('exports one complete clear function from the core and root entries', () => {
    expect(root.clearCaches).toBe(core.clearCaches);
  });
});

it('publishes the finite limits and complete clear contract in every required document', () => {
  for (const path of [
    'docs/caches.md',
    'README.md',
    'llms.txt',
    'AGENTS.md',
    'src/core/README.md',
  ]) {
    const document = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
    expect(document).toContain('2,000');
    expect(document).toContain('clearCaches()');
    expect(document).toContain('loaded');
    expect(document).not.toContain('This cache lifetime belongs to the consumer');
  }
});
