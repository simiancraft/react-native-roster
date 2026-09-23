import { type ReactNode, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { PlotStack } from '../layers/plot-stack';
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
      <PlotStack
        width={contentWidth}
        height={viewport.height}
        overlayZ={1}
        gridZone={gridZone}
        marksZone={listZone}
        overlayZone={overlayZone}
      />
    </ScrollView>
  );
}
