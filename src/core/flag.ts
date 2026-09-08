import type { Lane, LaneFlag, Window } from './types';

export function flagFor(lane: Lane, window: Window): LaneFlag {
  if (lane.flag !== undefined) return lane.flag;
  let hasIntervals = false;
  for (const layer of lane.layers) {
    for (const interval of layer.intervals) {
      hasIntervals = true;
      if (Math.max(interval.start, window.start) < Math.min(interval.end, window.end))
        return 'none';
    }
  }
  return hasIntervals ? 'empty-in-window' : 'none';
}
