import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { ScrollView, View } from 'react-native';

type TeamRosterLayoutProps = {
  contentDirection: 'row' | 'column';
  onContentLayout: (input: LayoutChangeEvent) => void;
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

export function TeamRosterLayout({
  contentDirection,
  onContentLayout,
  headerZone,
  toolbarZone,
  subjectZone,
  inspectorZone,
  footerZone,
}: TeamRosterLayoutProps) {
  if (contentDirection === 'column')
    return (
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
  return (
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
}
