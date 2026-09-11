import type { ReactNode } from 'react';
import { View } from 'react-native';

type TeamToolbarLayoutProps = {
  /** Width of the roster's people column; the filter aligns to it. */
  filterWidth: number;
  /** Stack the filter above the controls when the people column is too narrow. */
  direction: 'row' | 'column';
  /** Sits above the people column; PeopleFilter by default. */
  filterZone: ReactNode;
  /** Sits above the lanes; ZoneChips and SortChips by default, unrolled in order. */
  controlsZone: ReactNode;
};

export function TeamToolbarLayout({
  filterWidth,
  direction,
  filterZone,
  controlsZone,
}: TeamToolbarLayoutProps) {
  const strategy = TOOLBAR[direction];
  return (
    <View className={strategy.outline}>
      <View style={strategy.filter(filterWidth)}>{filterZone}</View>
      <View className={strategy.controls}>{controlsZone}</View>
    </View>
  );
}

type ToolbarStrategy = {
  outline: string;
  controls: string;
  /** The filter's width in this arrangement; undefined lets it fill the line. */
  filter: (filterWidth: number) => { width: number } | undefined;
};

const TOOLBAR: Record<TeamToolbarLayoutProps['direction'], ToolbarStrategy> = {
  row: {
    outline: 'flex-row items-start gap-3',
    controls: 'flex-1 min-w-0 flex-row flex-wrap items-center gap-2',
    filter: (filterWidth) => ({ width: filterWidth }),
  },
  column: {
    outline: 'gap-2',
    controls: 'flex-row flex-wrap items-center gap-2',
    filter: () => undefined,
  },
};
