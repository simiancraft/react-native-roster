import type { Interval, Lane, Window } from '../../src/core';

/** Workload W uses 200 lanes, seven days, two layers, and 24 visible lanes. */
export function workload(
  laneCount = 200,
  dayCount = 7,
  seed = 1318,
): { lanes: Lane[]; window: Window } {
  const start = Date.UTC(2024, 0, 1);
  const window = { start, end: start + dayCount * 86_400_000 };
  let state = seed >>> 0;
  function random(): number {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  }
  const lanes: Lane[] = [];
  for (let index = 0; index < laneCount; index++) {
    const intervals: Interval[] = [];
    const booked: Interval[] = [];
    const gaps: Interval[] = [];
    for (let day = 0; day < dayCount; day++) {
      const base = start + day * 86_400_000 + Math.floor(random() * 30) * 60_000;
      const a = { kind: 'rule', id: `${index}:a` };
      const b = { kind: 'rule', id: `${index}:b` };
      for (const hour of [9, 13]) {
        intervals.push({
          start: base + hour * 3_600_000,
          end: base + (hour + 2) * 3_600_000,
          sources: [a],
        });
        intervals.push({
          start: base + (hour + 1) * 3_600_000,
          end: base + (hour + 3) * 3_600_000,
          sources: [b],
        });
        booked.push({
          start: base + (hour + 1.5) * 3_600_000,
          end: base + (hour + 2.5) * 3_600_000,
          sources: [{ kind: 'session', id: `${index}:${day}:${hour}` }],
        });
      }
      gaps.push({
        start: base + 16 * 3_600_000,
        end: base + 16.25 * 3_600_000,
        sources: [{ kind: 'date', id: `${index}:${day}` }],
      });
      intervals.push({ start: base + 16.25 * 3_600_000, end: base + 17 * 3_600_000, sources: [b] });
    }
    lanes.push({
      id: `lane-${index}`,
      label: `Lane ${index}`,
      version: `${seed}:${dayCount}`,
      layers: [
        { id: 'open', role: 'availability', z: 0, style: { color: '#448866' }, intervals, gaps },
        {
          id: 'occupied',
          role: 'booking',
          z: 1,
          style: { color: '#224466', inset: 4 },
          intervals: booked,
        },
      ],
    });
  }
  return { lanes, window };
}
