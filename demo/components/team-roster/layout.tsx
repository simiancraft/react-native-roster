import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { ScrollView, View } from 'react-native';

type TeamRosterZones = {
  /** Title, window range, span, and navigation; whatever is placed here unrolls in order. */
  headerZone: ReactNode;
  /** Filter beside the people column and controls beside the lanes. */
  toolbarZone: ReactNode;
  /** The team roster; fills the remaining height. */
  subjectZone: ReactNode;
  /** Selected member card, their schedule, and the pressed event. */
  inspectorZone: ReactNode;
  /** Legend and any trailing notes under the roster. */
  footerZone: ReactNode;
};

type TeamRosterLayoutProps = TeamRosterZones & {
  /** Inspector beside the roster, or stacked under it on narrow screens. */
  direction: 'row' | 'column';
  /** Measures the content region so the chassis can choose the direction. */
  onContentLayout: (input: LayoutChangeEvent) => void;
};

type Strategy = (
  zones: TeamRosterZones,
  onContentLayout: TeamRosterLayoutProps['onContentLayout'],
) => ReactNode;

/** Roster and inspector side by side; the page never scrolls. */
const row: Strategy = (
  { headerZone, toolbarZone, subjectZone, inspectorZone, footerZone },
  onContentLayout,
) => (
  <View className="flex-1 min-h-0 bg-background px-4 pb-4 gap-3">
    {headerZone}
    <View onLayout={onContentLayout} className="flex-1 min-h-0 flex-row gap-4">
      <View className="flex-1 min-w-0 min-h-0 gap-3">
        {toolbarZone}
        <View className="flex-1 min-h-0">{subjectZone}</View>
        {footerZone}
      </View>
      <View className="w-[380px] min-h-0">{inspectorZone}</View>
    </View>
  </View>
);

/** Roster above the inspector at fixed heights; the page scrolls. */
const column: Strategy = (
  { headerZone, toolbarZone, subjectZone, inspectorZone, footerZone },
  onContentLayout,
) => (
  <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pb-4 gap-3">
    {headerZone}
    <View onLayout={onContentLayout} className="gap-4">
      <View className="gap-3">
        {toolbarZone}
        <View className="h-[440px]">{subjectZone}</View>
        {footerZone}
      </View>
      <View className="h-[600px]">{inspectorZone}</View>
    </View>
  </ScrollView>
);

const STRATEGIES: Record<TeamRosterLayoutProps['direction'], Strategy> = { row, column };

export function TeamRosterLayout({ direction, onContentLayout, ...zones }: TeamRosterLayoutProps) {
  return STRATEGIES[direction](zones, onContentLayout);
}
