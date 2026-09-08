import type { ReactNode } from 'react';
import { View } from 'react-native';

type GalleryRouteLayoutProps = {
  /** Fixture controls and title; wraps above the bounded roster viewport. */
  controlsZone: ReactNode;
  /** The Roster under test; fills the remaining screen height. */
  subjectZone: ReactNode;
  /** Counter snapshot and pressed sources; wraps below the roster. */
  countersZone: ReactNode;
};

export function GalleryRouteLayout({
  controlsZone,
  subjectZone,
  countersZone,
}: GalleryRouteLayoutProps) {
  return (
    <View style={{ flex: 1, minHeight: 0, backgroundColor: '#f1f5f9', padding: 12, gap: 12 }}>
      <View>{controlsZone}</View>
      <View style={{ flex: 1, minHeight: 160 }}>{subjectZone}</View>
      <View>{countersZone}</View>
    </View>
  );
}
