import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View } from 'react-native';

type FixtureLayoutProps = {
  /** Editor beside the subject, or stacked above it on narrow screens. */
  direction?: 'row' | 'column';
  /** Measures the content region so the chassis can choose the direction. */
  onContentLayout?: (input: LayoutChangeEvent) => void;
  /** Fixture controls and title; wraps above the bounded roster viewport. */
  controlsZone: ReactNode;
  /** The Roster under test; fills the remaining screen height. */
  subjectZone: ReactNode;
  /** Editable rule-set JSON and parse feedback beside the adapter roster. */
  ruleSetEditorZone?: ReactNode;
  /** Counter snapshot and pressed sources; wraps below the roster. */
  countersZone: ReactNode;
};

const CONTENT = {
  row: 'flex-1 min-h-0 flex-row gap-3',
  column: 'flex-1 min-h-0 flex-col gap-3',
} as const;

export function FixtureLayout({
  controlsZone,
  subjectZone,
  countersZone,
  ruleSetEditorZone,
  direction = 'row',
  onContentLayout,
}: FixtureLayoutProps) {
  return (
    <View className="flex-1 min-h-0 gap-3 bg-background p-3">
      <View>{controlsZone}</View>
      <View onLayout={onContentLayout} className={CONTENT[direction]}>
        {ruleSetEditorZone}
        <View className="flex-[3] min-w-0 min-h-0">{subjectZone}</View>
      </View>
      <View>{countersZone}</View>
    </View>
  );
}
