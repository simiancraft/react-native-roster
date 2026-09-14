import { Text, View } from 'react-native';
import type { RosterProps } from '../../src';
import { RosterBody, RosterHeader, RosterLaneLabelColumn } from '../../src';

export const replacedZones: Pick<
  RosterProps,
  | 'emptyZone'
  | 'headerComponent'
  | 'headerCellComponent'
  | 'laneLabelColumnComponent'
  | 'laneLabelComponent'
  | 'bodyComponent'
  | 'intervalComponent'
  | 'gapComponent'
> = {
  emptyZone: <Text>Custom empty roster</Text>,
  headerComponent: (input) => (
    <View style={{ backgroundColor: '#e0e7ff' }}>
      <RosterHeader {...input} />
    </View>
  ),
  headerCellComponent: ({ tick }) => (
    <Text style={{ color: '#4338ca', padding: 4, fontSize: 11 }}>{tick.label.toUpperCase()}</Text>
  ),
  laneLabelColumnComponent: (input) => (
    <View style={{ flex: 1, backgroundColor: '#e0e7ff' }}>
      <RosterLaneLabelColumn {...input} />
    </View>
  ),
  laneLabelComponent: ({ lane, complete }) => (
    <Text style={{ padding: 8, color: '#4338ca' }}>
      {lane.label} · {complete ? 'Complete' : 'Partial'}
    </Text>
  ),
  bodyComponent: (input) => (
    <View style={{ flex: 1, backgroundColor: '#faf5ff' }}>
      <RosterBody {...input} />
    </View>
  ),
  intervalComponent: ({ rect, layer }) => (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: rect.z,
        backgroundColor: layer.style.color,
        borderWidth: 2,
        borderColor: '#a855f7',
        borderRadius: 6,
      }}
    />
  ),
  gapComponent: () => (
    <View pointerEvents="none" style={{ flex: 1, backgroundColor: '#fef3c7' }}>
      <Text style={{ color: '#92400e', fontSize: 11 }}>Excluded</Text>
    </View>
  ),
};
