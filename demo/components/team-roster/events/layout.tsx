import type { ReactNode } from 'react';
import { View } from 'react-native';

export function EventLayout({
  headingZone,
  axisZone,
  attendancesZone,
}: {
  /** Title, scheduled range, and description. */
  headingZone: ReactNode;
  /** Shared time scale and reading key. */
  axisZone: ReactNode;
  /** Expected attendees with scheduled outlines and actual spans. */
  attendancesZone: ReactNode;
}) {
  return (
    <View className="w-[280px] gap-3 rounded-xl border border-border bg-card p-3">
      {headingZone}
      {axisZone}
      <View className="gap-3">{attendancesZone}</View>
    </View>
  );
}
