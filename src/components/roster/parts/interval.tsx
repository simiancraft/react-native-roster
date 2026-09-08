import { View } from 'react-native';
import type { IntervalInput } from '../roster.types';
import { stylesFor } from '../utils/styles';

export function RosterInterval({ rect, layer, highlighted }: IntervalInput) {
  const styles = stylesFor(layer);
  const fill = highlighted ? styles.highlighted : styles.normal;
  return (
    <View
      pointerEvents="none"
      style={[
        fill,
        {
          position: 'absolute',
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          zIndex: rect.z,
        },
      ]}
    />
  );
}
