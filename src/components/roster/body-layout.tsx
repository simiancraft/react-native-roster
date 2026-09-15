import { type ReactNode, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { BodyInput } from './roster.types';

export function RosterBodyLayout({
  scroll,
  contentWidth,
  viewport,
  gridZone,
  listZone,
  overlayZone,
}: Pick<BodyInput, 'scroll' | 'contentWidth' | 'viewport'> & {
  /** Noninteractive grid behind the lane list. */
  gridZone: ReactNode;
  /** Virtualized lane collection within the measured viewport. */
  listZone: ReactNode;
  /** Noninteractive content above the grid and lane list, following horizontal scroll. */
  overlayZone?: ReactNode;
}) {
  const [contentOffset] = useState(() => ({ x: scroll.x.get(), y: 0 }));
  return (
    <ScrollView
      testID="roster-horizontal-scroll"
      ref={scroll.bodyRef}
      contentOffset={contentOffset}
      horizontal
      onScroll={scroll.onBodyScroll}
      scrollEventThrottle={16}
      style={{ flex: 1 }}
    >
      <View style={{ width: contentWidth, height: viewport.height }}>
        {gridZone}
        {listZone}
        {overlayZone != null ? (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 1 }}
          >
            {overlayZone}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
