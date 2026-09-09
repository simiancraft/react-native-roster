import type { ReactNode } from 'react';
import { View } from 'react-native';

type TeamToolbarLayoutProps = {
  /** Width of the roster's people column; the filter aligns to it. */
  filterWidth: number;
  /** Stack the filter above the controls when the people column is too narrow. */
  direction: 'row' | 'column';
  /** Sits above the people column. */
  filterZone: ReactNode;
  /** Sits above the lanes; controls unroll in order. */
  controlsZone: ReactNode;
};

export function TeamToolbarLayout({
  filterWidth,
  direction,
  filterZone,
  controlsZone,
}: TeamToolbarLayoutProps) {
  const classes = TOOLBAR[direction];
  return (
    <View className={classes.outline}>
      <View style={direction === 'row' ? { width: filterWidth } : undefined}>{filterZone}</View>
      <View className={classes.controls}>{controlsZone}</View>
    </View>
  );
}

const TOOLBAR = {
  row: {
    outline: 'flex-row items-start gap-3',
    controls: 'flex-1 min-w-0 flex-row flex-wrap items-center gap-2',
  },
  column: { outline: 'gap-2', controls: 'flex-row flex-wrap items-center gap-2' },
} as const;
