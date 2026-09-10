import { Text, View } from 'react-native';
import type { LaneLabelInput } from '../../roster.types';

export function RosterLaneLabel({
  lane,
  flag,
  complete,
  viewTimezone,
  incompleteLabel,
  neverSetLabel,
}: LaneLabelInput) {
  const zone =
    lane.timezone && lane.timezone !== viewTimezone ? (
      <Text style={{ fontSize: 10, color: '#64748b' }}>{lane.timezone}</Text>
    ) : null;
  const flagText =
    flag === 'never-set' ? (
      <Text style={{ fontSize: 10, color: '#9a3412' }}>{neverSetLabel}</Text>
    ) : null;
  const completeness = complete ? null : (
    <Text style={{ fontSize: 10, color: '#9a3412' }}>{incompleteLabel}</Text>
  );
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
      }}
    >
      <Text numberOfLines={1} style={{ color: '#0f172a', fontSize: 12 }}>
        {lane.label}
      </Text>
      {zone}
      {flagText}
      {completeness}
    </View>
  );
}
