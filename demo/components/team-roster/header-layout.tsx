import type { ReactNode } from 'react';
import { View } from 'react-native';

type TeamHeaderLayoutProps = {
  /** Leading cluster: back link, title, and window range, stacked. */
  titleZone: ReactNode;
  /** Trailing cluster: span chips and window navigation, in a row. */
  actionsZone: ReactNode;
};

export function TeamHeaderLayout({ titleZone, actionsZone }: TeamHeaderLayoutProps) {
  return (
    <View className="flex-row flex-wrap items-end justify-between gap-3">
      <View className="gap-1">{titleZone}</View>
      <View className="flex-row flex-wrap items-center gap-2">{actionsZone}</View>
    </View>
  );
}
