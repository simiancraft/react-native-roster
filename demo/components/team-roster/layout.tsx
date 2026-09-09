import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View } from 'react-native';

type TeamRosterLayoutProps = {
  contentDirection: 'row' | 'column';
  onContentLayout: (input: LayoutChangeEvent) => void;
  /** Title, week navigation, view zone, sort, and search. */
  toolbarZone: ReactNode;
  /** The team roster; fills the remaining height. */
  subjectZone: ReactNode;
  /** Selected member card, their schedule, and the pressed event. */
  inspectorZone: ReactNode;
  /** Layer and event-kind legend under the roster. */
  legendZone: ReactNode;
};

export function TeamRosterLayout({
  contentDirection,
  onContentLayout,
  toolbarZone,
  subjectZone,
  inspectorZone,
  legendZone,
}: TeamRosterLayoutProps) {
  const row = contentDirection === 'row';
  return (
    <View className="flex-1 min-h-0 bg-zinc-950 p-4 gap-4">
      {toolbarZone}
      <View
        onLayout={onContentLayout}
        className={row ? 'flex-1 min-h-0 flex-row gap-4' : 'flex-1 min-h-0 flex-col gap-4'}
      >
        <View className="flex-1 min-w-0 min-h-0 gap-3">
          <View className="flex-1 min-h-0">{subjectZone}</View>
          {legendZone}
        </View>
        <View className={row ? 'w-[380px] min-h-0' : 'h-[560px]'}>{inspectorZone}</View>
      </View>
    </View>
  );
}
