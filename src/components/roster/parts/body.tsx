import { LegendList } from '@legendapp/list';
import { Profiler, type ProfilerOnRenderCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { LaneRow } from '../lanes/lane';
import type { BodyInput } from '../roster.types';
import { bodyContentKey } from '../utils/body-content-key';

export function RosterBody({
  lanes,
  geometryFor,
  projection,
  scroll,
  press,
  ticks,
  contentWidth,
  viewport,
  window,
  intervalZone,
  gapZone,
  gridZone,
  highlightSource,
  onIntervalHover,
  incompleteLabel,
  onRowRender,
}: BodyInput & {
  /** Optional per-lane commit observer; used by the development gallery's Profiler gate. */
  onRowRender?: ProfilerOnRenderCallback;
}) {
  // LegendList requires a measured viewport and does not support static rendering.
  if (viewport.width <= 0 || viewport.height <= 0) return null;
  return (
    <ScrollView
      testID="roster-horizontal-scroll"
      ref={scroll.bodyRef}
      horizontal
      onScroll={scroll.onBodyScroll}
      scrollEventThrottle={16}
      style={{ flex: 1 }}
    >
      <View style={{ width: contentWidth, height: viewport.height }}>
        {gridZone({ ticks, contentWidth })}
        <LegendList
          testID="roster-vertical-scroll"
          data={lanes}
          extraData={bodyContentKey({
            window,
            projection,
            highlightSource,
            intervalZone,
            gapZone,
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
                intervalZone={intervalZone}
                gapZone={gapZone}
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
      </View>
    </ScrollView>
  );
}
