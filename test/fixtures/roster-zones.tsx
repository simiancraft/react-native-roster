import { Text, View } from 'react-native';
import type { RosterProps } from '../../src';
import { RosterBody, RosterHeader, RosterLaneLabelColumn } from '../../src';

export const replacedZones: Pick<
  RosterProps,
  | 'emptyZone'
  | 'headerZone'
  | 'headerCellZone'
  | 'laneLabelColumnZone'
  | 'laneLabelZone'
  | 'bodyZone'
  | 'intervalZone'
  | 'gapZone'
> = {
  emptyZone: () => <Text>Custom empty roster</Text>,
  headerZone: (input) => (
    <View style={{ backgroundColor: '#e0e7ff' }}>
      <RosterHeader {...input} />
    </View>
  ),
  headerCellZone: ({ tick }) => (
    <Text style={{ color: '#4338ca', padding: 4, fontSize: 11 }}>{tick.label.toUpperCase()}</Text>
  ),
  laneLabelColumnZone: (input) => (
    <View style={{ flex: 1, backgroundColor: '#e0e7ff' }}>
      <RosterLaneLabelColumn {...input} />
    </View>
  ),
  laneLabelZone: ({ lane, complete }) => (
    <Text style={{ padding: 8, color: '#4338ca' }}>
      {lane.label} · {complete ? 'Complete' : 'Partial'}
    </Text>
  ),
  bodyZone: (input) => (
    <View style={{ flex: 1, backgroundColor: '#faf5ff' }}>
      <RosterBody {...input} />
    </View>
  ),
  intervalZone: ({ rect, layer }) => (
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
  gapZone: () => (
    <View pointerEvents="none" style={{ flex: 1, backgroundColor: '#fef3c7' }}>
      <Text style={{ color: '#92400e', fontSize: 11 }}>Excluded</Text>
    </View>
  ),
};
