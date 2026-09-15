import type { ProfilerOnRenderCallback } from 'react';
import { RosterBodyLayout } from '../body-layout';
import type { BodyInput } from '../roster.types';
import { RosterLaneList } from './lane-list';

export function RosterBody(
  props: BodyInput & {
    /** Development-only Profiler hook used by the gallery; not a supported customization point. */
    onRowRender?: ProfilerOnRenderCallback;
  },
) {
  const {
    nowLine,
    nowLineComponent: NowLineComponent,
    ticks,
    gridComponent: GridComponent,
    lanes,
    geometryFor,
    projection,
    scroll,
    press,
    contentWidth,
    viewport,
    window,
    intervalComponent,
    gapComponent,
    highlightSource,
    onIntervalHover,
    incompleteLabel,
    onRowRender,
  } = props;
  // LegendList requires a measured viewport and does not support static rendering.
  if (viewport.width <= 0 || viewport.height <= 0) return null;
  return (
    <RosterBodyLayout
      scroll={scroll}
      contentWidth={contentWidth}
      viewport={viewport}
      gridZone={<GridComponent ticks={ticks} contentWidth={contentWidth} />}
      listZone={
        <RosterLaneList
          lanes={lanes}
          geometryFor={geometryFor}
          projection={projection}
          scroll={scroll}
          press={press}
          contentWidth={contentWidth}
          viewport={viewport}
          window={window}
          intervalComponent={intervalComponent}
          gapComponent={gapComponent}
          highlightSource={highlightSource}
          onIntervalHover={onIntervalHover}
          incompleteLabel={incompleteLabel}
          onRowRender={onRowRender}
        />
      }
      overlayZone={nowLine ? <NowLineComponent {...nowLine} /> : null}
    />
  );
}
