import { type ReactNode, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { BodyInput } from './roster.types';

export function RosterBodyLayout({
  scroll,
  contentWidth,
  viewport,
  gridZone,
  listZone,
}: Pick<BodyInput, 'scroll' | 'contentWidth' | 'viewport'> & {
  /** Noninteractive grid behind the lane list. */
  gridZone: ReactNode;
  /** Virtualized lane collection within the measured viewport. */
  listZone: ReactNode;
}) {
  const [contentOffset] = useState(() => ({ x: scroll.x.get(), y: 0 }));
  const bodyRef = scroll.bodyRef;
  useEffect(() => {
    bodyRef.current?.scrollTo({ x: contentOffset.x, animated: false });
  }, [bodyRef, contentOffset]);
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
      </View>
    </ScrollView>
  );
}
