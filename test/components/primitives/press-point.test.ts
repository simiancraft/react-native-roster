import { describe, expect, it } from 'bun:test';
import { pressPoint } from '../../../src/components/primitives/press-point.web';

describe('pressPoint on web', () => {
  it('maps DOM clicks relative to the pressed row and centers keyboard presses', () => {
    const currentTarget = {
      getBoundingClientRect: () => ({ left: 200, top: 80, width: 500, height: 48 }),
    };
    expect(pressPoint({ currentTarget, nativeEvent: { clientX: 340, clientY: 92 } })).toEqual({
      x: 140,
      y: 12,
    });
    expect(pressPoint({ currentTarget, nativeEvent: {} })).toEqual({ x: 250, y: 24 });
  });
});
