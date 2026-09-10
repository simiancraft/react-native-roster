import { Text, View } from 'react-native';

export function ScheduleSkippedDate({ localDate }: { localDate: string }) {
  return (
    <View testID={`schedule-missing-${localDate}`} style={{ width: 0, zIndex: 1 }}>
      <Text
        accessibilityLabel={`Skipped local date ${localDate}`}
        style={{
          width: 110,
          marginLeft: -55,
          marginTop: 62,
          fontSize: 9,
          color: '#92400e',
          backgroundColor: '#fef3c7',
          textAlign: 'center',
        }}
      >
        Skipped {localDate}
      </Text>
    </View>
  );
}
