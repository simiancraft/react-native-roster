import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View } from 'react-native';
import type { RosterStyleProps } from './roster.types';
import { regionStyle } from './utils/region-style';

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
    <View style={regionStyle(structure.root, paint.root, style)}>
      <View style={regionStyle(structure.header, paint.header, headerStyle)}>
        <View style={{ width: laneLabelWidth }}>{cornerZone}</View>
        <View style={structure.headerStrip}>{headerZone}</View>
      </View>
      <View style={structure.content}>
        <View
          style={regionStyle(
            { ...structure.labels, width: laneLabelWidth },
            paint.labels,
            laneLabelColumnStyle,
          )}
        >
          {laneLabelColumnZone}
        </View>
        <View onLayout={onLayout} style={regionStyle(structure.body, {}, bodyStyle)}>
          {bodyZone}
        </View>
      </View>
    </View>
  );
}

const structure = {
  root: { flex: 1, minHeight: 0, overflow: 'hidden' },
  header: { flexDirection: 'row', height: 40, overflow: 'hidden' },
  headerStrip: { flex: 1, minWidth: 0, overflow: 'hidden' },
  content: { flex: 1, minHeight: 0, flexDirection: 'row' },
  labels: { overflow: 'hidden' },
  body: { flex: 1, minWidth: 0, overflow: 'hidden' },
} as const;
// Paint is what a class replaces; see regionStyle.
const paint = {
  root: { backgroundColor: '#fff' },
  header: { borderBottomWidth: 1, borderBottomColor: '#cbd5e1' },
  labels: { borderRightWidth: 1, borderRightColor: '#cbd5e1' },
} as const;
