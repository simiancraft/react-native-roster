import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View } from 'react-native';

type FixtureLayoutProps = {
  contentDirection?: 'row' | 'column';
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

export function FixtureLayout({
  controlsZone,
  subjectZone,
  countersZone,
  ruleSetEditorZone,
  contentDirection = 'row',
  onContentLayout,
}: FixtureLayoutProps) {
  return (
    <View style={{ flex: 1, minHeight: 0, backgroundColor: '#f1f5f9', padding: 12, gap: 12 }}>
      <View>{controlsZone}</View>
      <View
        onLayout={onContentLayout}
        style={{ flex: 1, minHeight: 0, flexDirection: contentDirection, gap: 12 }}
      >
        {ruleSetEditorZone}
        <View style={{ flex: 3, minWidth: 0, minHeight: 0 }}>{subjectZone}</View>
      </View>
      <View>{countersZone}</View>
    </View>
  );
}
