import { View } from 'react-native';
import type { WindowBandPiece } from '../../utils/window-band';

export function ScheduleWindowBand({ x, y, width, height }: WindowBandPiece) {
  return (
    <View
      testID="schedule-window-band"
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        backgroundColor: 'rgba(37, 99, 235, 0.14)',
      }}
    />
  );
}
