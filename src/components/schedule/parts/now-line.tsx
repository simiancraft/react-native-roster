import { View } from 'react-native';

export function ScheduleNowLine({ y, column }: { y: number; column: number }) {
  return (
    <View
      testID={`schedule-now-${column}`}
      pointerEvents="none"
      style={{ position: 'absolute', top: y, width: '100%', height: 2, backgroundColor: '#dc2626' }}
    />
  );
}
