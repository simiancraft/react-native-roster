import { LegendList } from '@legendapp/list';
import { Profiler, type ProfilerOnRenderCallback, useState } from 'react';
import { LaneRow } from '../lanes/lane';
import type { LaneListInput } from '../roster.types';
import { bodyContentKey } from '../utils/body-content-key';

export function RosterLaneList({
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
}: LaneListInput & {
  /** Development-only Profiler hook used by the gallery; not a supported customization point. */
  onRowRender?: ProfilerOnRenderCallback;
}) {
  const [initialScrollOffset] = useState(() => scroll.y.get());
  return (
    <LegendList
      ref={scroll.verticalRef}
      testID="roster-vertical-scroll"
      initialScrollOffset={initialScrollOffset}
      data={lanes}
      extraData={bodyContentKey({
        window,
        projection,
        highlightSource,
        intervalComponent,
        gapComponent,
        onIntervalHover,
        incompleteLabel,
      })}
      keyExtractor={(lane) => lane.id}
      estimatedListSize={{ width: contentWidth, height: viewport.height }}
      estimatedItemSize={projection.rowHeight}
      getFixedItemSize={() => projection.rowHeight}
      drawDistance={0}
      recycleItems={false}
      maintainVisibleContentPosition={false}
      onScroll={scroll.onVerticalScroll}
      scrollEventThrottle={16}
      style={{ flex: 1 }}
      renderItem={({ item }) => {
        const row = (
          <LaneRow
            lane={item}
            geometry={geometryFor(item)}
            width={contentWidth}
            rowHeight={projection.rowHeight}
            press={press}
            intervalComponent={intervalComponent}
            gapComponent={gapComponent}
            highlightSource={highlightSource}
            onIntervalHover={onIntervalHover}
            incompleteLabel={incompleteLabel}
          />
        );
        if (onRowRender)
          return (
            <Profiler id={item.id} onRender={onRowRender}>
              {row}
            </Profiler>
          );
        return row;
      }}
    />
  );
}
