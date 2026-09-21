import { describe, expect, it } from 'bun:test';
import { touch, trim } from '../../src/core/lru';

describe('insertion-order LRU mechanics', () => {
  it('adds touched entries at the newest end', () => {
    const cache = new Map<string, number>();

    expect(touch(cache, 'a', 1)).toBe(1);
    touch(cache, 'b', 2);

    expect([...cache]).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });

  it('refreshes an existing entry to the newest end', () => {
    const cache = new Map([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);

    touch(cache, 'a', 4);

    expect([...cache]).toEqual([
      ['b', 2],
      ['c', 3],
      ['a', 4],
    ]);
  });

  it('trims multiple oldest entries to the supplied limit', () => {
    const cache = new Map([
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 4],
    ]);

    trim(cache, 2);

    expect([...cache]).toEqual([
      ['c', 3],
      ['d', 4],
    ]);
  });

  it('clears all entries for a zero limit', () => {
    const cache = new Map([
      ['a', 1],
      ['b', 2],
    ]);

    trim(cache, 0);

    expect(cache.size).toBe(0);
  });

  it('does not change a cache already within the limit', () => {
    const cache = new Map([
      ['a', 1],
      ['b', 2],
    ]);

    trim(cache, 2);

    expect([...cache]).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });
});
