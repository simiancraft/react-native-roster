import type { ReactNode } from 'react';
import { View } from 'react-native';

export function EventLayout({
  headerZone,
  chartZone,
  footerZone,
}: {
  /** Title, scheduled time range, zone, and description. */
  headerZone: ReactNode;
  /** Shared axis, tick lines, scheduled band, and compact attendance rows. */
  chartZone: ReactNode;
  /** Muted explanation of attendance and the scheduled band. */
  footerZone: ReactNode;
}) {
  return (
    <View className="w-[380px] max-w-full gap-3 rounded-xl border border-border bg-card p-3">
      {headerZone}
      {chartZone}
      {footerZone}
    </View>
  );
}
