import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View } from 'react-native';
import type { RosterStyleProps } from './roster.types';

type RosterLayoutProps = Omit<RosterStyleProps, `${string}ClassName` | 'className'> & {
  /** Cell above the lane labels, beside the header. */
  cornerZone: ReactNode;
  /** Frozen tick row; the layout clips translated header content. */
  headerZone: ReactNode;
  /** Frozen lane labels; the layout supplies the label column and clips vertical translation. */
  laneLabelColumnZone: ReactNode;
  /** Virtualized body with its horizontal scroller; fills the measured viewport. */
  bodyZone: ReactNode;
  onLayout: (input: LayoutChangeEvent) => void;
};

export function RosterLayout({
  cornerZone,
  headerZone,
  laneLabelColumnZone,
  bodyZone,
  onLayout,
  style,
  headerStyle,
  laneLabelColumnStyle,
  bodyStyle,
  laneLabelWidth = 180,
}: RosterLayoutProps) {
  return (
    <View style={[{ flex: 1, minHeight: 0, backgroundColor: '#fff', overflow: 'hidden' }, style]}>
      <View
        style={[
          {
            flexDirection: 'row',
            height: 40,
            overflow: 'hidden',
            borderBottomWidth: 1,
            borderBottomColor: '#cbd5e1',
          },
          headerStyle,
        ]}
      >
        <View style={{ width: laneLabelWidth }}>{cornerZone}</View>
        <View style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>{headerZone}</View>
      </View>
      <View style={{ flex: 1, minHeight: 0, flexDirection: 'row' }}>
        <View
          style={[
            {
              width: laneLabelWidth,
              overflow: 'hidden',
              borderRightWidth: 1,
              borderRightColor: '#cbd5e1',
            },
            laneLabelColumnStyle,
          ]}
        >
          {laneLabelColumnZone}
        </View>
        <View onLayout={onLayout} style={[{ flex: 1, minWidth: 0, overflow: 'hidden' }, bodyStyle]}>
          {bodyZone}
        </View>
      </View>
    </View>
  );
}
