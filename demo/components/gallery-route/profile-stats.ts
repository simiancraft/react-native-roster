import type { ProfilerOnRenderCallback } from 'react';

const counts = {
  body: { mounts: 0, updates: 0 },
  lanes: {} as Record<string, { mounts: number; updates: number }>,
};

export function profileStats() {
  return {
    body: { ...counts.body },
    lanes: Object.fromEntries(
      Object.entries(counts.lanes).map(([id, value]) => [id, { ...value }]),
    ),
  };
}

export function recordBody(_id: string, phase: Parameters<ProfilerOnRenderCallback>[1]) {
  counts.body[phase === 'mount' ? 'mounts' : 'updates']++;
}
export function recordLane(id: string, phase: Parameters<ProfilerOnRenderCallback>[1]) {
  const lane = counts.lanes[id] ?? { mounts: 0, updates: 0 };
  lane[phase === 'mount' ? 'mounts' : 'updates']++;
  counts.lanes[id] = lane;
}
