import { describe, expect, it } from 'bun:test';
import type { ViewStyle } from 'react-native';
import { regionStyle } from '../../../src/components/primitives/region-style';

describe('regionStyle', () => {
  const structure = { flex: 1 };
  const paint = { backgroundColor: '#fff' };
  it('keeps default paint for native styles and drops it for class entries', () => {
    expect(regionStyle(structure, paint, undefined)).toEqual([structure, paint, undefined]);
    expect(regionStyle(structure, paint, { padding: 2 })).toEqual([
      structure,
      paint,
      { padding: 2 },
    ]);
    const classEntry = { $$css: true, 'bg-zinc-950': 'bg-zinc-950' } as unknown as ViewStyle;
    expect(regionStyle(structure, paint, classEntry)).toEqual([structure, null, classEntry]);
    expect(regionStyle(structure, paint, [{ padding: 2 }, [classEntry]])).toEqual([
      structure,
      null,
      [{ padding: 2 }, [classEntry]],
    ]);
    expect(regionStyle(structure, paint, [null, false, undefined])).toEqual([
      structure,
      paint,
      [null, false, undefined],
    ]);
  });
});
