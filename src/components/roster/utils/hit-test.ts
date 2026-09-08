import type { Lane, LaneGeometry, Rect } from '../../../core';

export function hitTest(
  lane: Lane,
  geometry: LaneGeometry,
  x: number,
  y: number,
): { kind: 'interval' | 'gap'; rect: Rect } | undefined {
  for (const kind of ['interval', 'gap'] as const) {
    const rects = kind === 'interval' ? geometry.rects : geometry.gapRects;
    let hit: Rect | undefined;
    for (const rect of rects) {
      if (x < rect.x || x >= rect.x + rect.width || y < rect.y || y >= rect.y + rect.height)
        continue;
      const previous = hit;
      if (
        !previous ||
        rect.z > previous.z ||
        (rect.z === previous.z &&
          lane.layers.findIndex((layer) => layer.id === rect.layerId) >
            lane.layers.findIndex((layer) => layer.id === previous.layerId))
      )
        hit = rect;
    }
    if (hit) return { kind, rect: hit };
  }
}
