import type { ReactNode } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

type RosterLayoutProps = {
  /** Frozen tick row; the layout clips translated header content. */
  headerZone: ReactNode;
  /** Frozen lane labels; the layout supplies a 180 px column and clips vertical translation. */
  laneLabelColumnZone: ReactNode;
  /** Virtualized body with its horizontal scroller; fills the measured viewport. */
  bodyZone: ReactNode;
  onLayout: (input: LayoutChangeEvent) => void;
  style?: StyleProp<ViewStyle>;
};

export function RosterLayout({
  headerZone,
  laneLabelColumnZone,
  bodyZone,
  onLayout,
  style,
}: RosterLayoutProps) {
  return (
    <View style={[{ flex: 1, minHeight: 0, backgroundColor: '#fff', overflow: 'hidden' }, style]}>
      <View
        style={{
          height: 40,
          marginLeft: 180,
          overflow: 'hidden',
          borderBottomWidth: 1,
          borderBottomColor: '#cbd5e1',
        }}
      >
        {headerZone}
      </View>
      <View style={{ flex: 1, minHeight: 0, flexDirection: 'row' }}>
        <View
          style={{
            width: 180,
            overflow: 'hidden',
            borderRightWidth: 1,
            borderRightColor: '#cbd5e1',
          }}
        >
          {laneLabelColumnZone}
        </View>
        <View onLayout={onLayout} style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {bodyZone}
        </View>
      </View>
    </View>
  );
}
