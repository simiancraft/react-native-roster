import { describe, expect, it } from 'bun:test';
import { timeAtX, xAtTime } from '../../src/core';

describe('horizontal time conversion', () => {
  it('maps absolute instants to elapsed pixels and round-trips through timeAtX', () => {
    const window = { start: Date.UTC(2024, 0, 1), end: Date.UTC(2024, 0, 2) };
    const projection = {
      orientation: 'horizontal' as const,
      viewTimezone: 'UTC',
      pxPerMinute: 2,
      rowHeight: 48,
    };
    for (const [minutes, x] of [
      [-1, -2],
      [0, 0],
      [0.5, 1],
      [90, 180],
      [1440, 2880],
    ] as const) {
      const time = window.start + minutes * 60_000;
      expect(xAtTime(projection, window, time)).toBe(x);
      expect(timeAtX(projection, window, x)).toBe(time);
    }
  });
});
