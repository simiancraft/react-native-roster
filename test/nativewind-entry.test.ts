import './render-host.test';
import { describe, expect, it, mock } from 'bun:test';

// NativeWind's runtime resolves class strings through the app's Metro pipeline,
// which Bun does not run; the entry's contract is the registration it performs.
const cssInterop = mock((component: unknown, mapping: Record<string, string>) => ({
  component,
  mapping,
}));
mock.module('nativewind', () => ({ cssInterop }));

describe('nativewind entry', () => {
  it('registers Roster and Schedule with one class prop per chrome style prop', async () => {
    const entry = await import('../src/nativewind');
    const { Roster } = await import('../src/components/roster');
    const { Schedule } = await import('../src/components/schedule');
    expect(cssInterop).toHaveBeenCalledTimes(2);
    expect(cssInterop.mock.calls[0]?.[0]).toBe(Roster);
    expect(cssInterop.mock.calls[0]?.[1]).toEqual({
      className: 'style',
      headerClassName: 'headerStyle',
      laneLabelColumnClassName: 'laneLabelColumnStyle',
      bodyClassName: 'bodyStyle',
    });
    expect(cssInterop.mock.calls[1]?.[0]).toBe(Schedule);
    expect(cssInterop.mock.calls[1]?.[1]).toEqual({
      className: 'style',
      headerClassName: 'headerStyle',
      gutterClassName: 'gutterStyle',
      daysClassName: 'daysStyle',
    });
    expect<unknown>(entry.Roster).toBe(cssInterop.mock.results[0]?.value);
    expect<unknown>(entry.Schedule).toBe(cssInterop.mock.results[1]?.value);
    for (const target of Object.values(entry.rosterClassNames)) expect(target).toMatch(/style$/i);
    for (const target of Object.values(entry.scheduleClassNames)) expect(target).toMatch(/style$/i);
  });
});
