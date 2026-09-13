import type { ProfilerOnRenderCallback } from 'react';
import { RosterBodyLayout } from '../body-layout';
import type { BodyInput } from '../roster.types';
import { RosterLaneList } from './lane-list';

export function RosterBody(
  props: BodyInput & {
    /** Optional per-lane commit observer; used by the development gallery's Profiler gate. */
    onRowRender?: ProfilerOnRenderCallback;
  },
) {
  const { viewport, scroll, contentWidth, ticks, gridComponent: GridComponent } = props;
  // LegendList requires a measured viewport and does not support static rendering.
  if (viewport.width <= 0 || viewport.height <= 0) return null;
  return (
    <RosterBodyLayout
      scroll={scroll}
      contentWidth={contentWidth}
      viewport={viewport}
      gridZone={<GridComponent ticks={ticks} contentWidth={contentWidth} />}
      listZone={<RosterLaneList {...props} />}
    />
  );
}
