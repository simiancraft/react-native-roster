import type { ReactNode } from 'react';
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
        {gridZone}
        {listZone}
      </View>
    </ScrollView>
  );
}
