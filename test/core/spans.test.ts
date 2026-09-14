import { describe, expect, it } from 'bun:test';
import { extentOf as rootExtentOf, intersectionOf as rootIntersectionOf } from '../../src';
import type { Window } from '../../src/core';
import { extentOf, intersectionOf } from '../../src/core';

describe('interval helpers', () => {
  it('exports the same helpers from root and core', () => {
    expect(rootExtentOf).toBe(extentOf);
    expect(rootIntersectionOf).toBe(intersectionOf);
  });

  it('returns null for empty input', () => {
    expect(extentOf([])).toBeNull();
    expect(intersectionOf([])).toBeNull();
  });

  it('returns the bounds of one segment without copying metadata', () => {
    const segment = Object.freeze({ start: -10, end: 20, label: 'One' });
    const segments: readonly Window[] = Object.freeze([segment]);
    expect(extentOf(segments)).toEqual({ start: -10, end: 20 });
    expect(intersectionOf(segments)).toEqual({ start: -10, end: 20 });
  });

  it('finds outer and shared bounds of overlapping segments in any order', () => {
    const segments = Object.freeze([
      Object.freeze({ start: 20, end: 50 }),
      Object.freeze({ start: 0, end: 40 }),
      Object.freeze({ start: 10, end: 60 }),
    ]);
    for (const input of [segments, [...segments].reverse()]) {
      expect(extentOf(input)).toEqual({ start: 0, end: 60 });
      expect(intersectionOf(input)).toEqual({ start: 20, end: 40 });
    }
  });

  it('bridges disjoint segments while their intersection stays empty', () => {
    const segments = [
      { start: 30, end: 40 },
      { start: 0, end: 10 },
      { start: 5, end: 35 },
    ];
    expect(extentOf(segments)).toEqual({ start: 0, end: 40 });
    expect(intersectionOf(segments)).toBeNull();
  });

  it('treats the single shared boundary of touching segments as empty', () => {
    const segments = [
      { start: 0, end: 10 },
      { start: 10, end: 20 },
    ];
    expect(extentOf(segments)).toEqual({ start: 0, end: 20 });
    expect(intersectionOf(segments)).toBeNull();
  });

  it('preserves a one-millisecond intersection at large epoch values', () => {
    for (const start of [8_000_000_000_000_000, -8_000_000_000_000_000]) {
      const segments = [
        { start, end: start + 10 },
        { start: start + 9, end: start + 20 },
      ];
      expect(extentOf(segments)).toEqual({ start, end: start + 20 });
      expect(intersectionOf(segments)).toEqual({ start: start + 9, end: start + 10 });
    }
  });

  for (const helper of [extentOf, intersectionOf]) {
    it(`${helper.name} rejects invalid bounds even after disjoint segments`, () => {
      for (const invalid of [
        { start: Number.NaN, end: 10 },
        { start: Infinity, end: 10 },
        { start: -Infinity, end: 10 },
        { start: 0, end: Number.NaN },
        { start: 0, end: Infinity },
        { start: 0, end: -Infinity },
        { start: 10, end: 10 },
        { start: 20, end: 10 },
      ]) {
        for (const segments of [
          [invalid],
          [{ start: 0, end: 10 }, { start: 20, end: 30 }, invalid],
        ]) {
          expect(() => helper(segments)).toThrow(RangeError);
          expect(() => helper(segments)).toThrow(
            'Span bounds must be finite with end greater than start',
          );
        }
      }
    });
  }
});
