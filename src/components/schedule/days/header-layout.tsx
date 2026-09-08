import type { ReactNode } from 'react';
import { View } from 'react-native';

type ScheduleDayHeaderLayoutProps = {
  width: number;
  /** Day heading supplied by dayHeaderZone, aligned with its column. */
  headerZone: ReactNode;
};

export function ScheduleDayHeaderLayout({ width, headerZone }: ScheduleDayHeaderLayoutProps) {
  return <View style={{ width, paddingBottom: 18 }}>{headerZone}</View>;
}
