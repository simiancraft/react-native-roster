import { Text, View } from 'react-native';
import { KIND_COLORS, STATUS_COLORS } from '../utils/tones';

/** attendance-together is the shared accent; attendance-dead marks inner waiting and lingering.
 * attendance-ink supplies caption contrast on every status fill in both schemes.
 */
export function AttendanceLegend() {
  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap gap-x-3 gap-y-2">
        {[
          ...Object.values(KIND_COLORS),
          ...Object.values(STATUS_COLORS),
          { label: 'Together', fill: 'bg-attendance-together' },
          { label: 'Dead time', fill: 'bg-attendance-dead-band border border-attendance-dead' },
        ].map(({ label, fill }) => (
          <View key={label} className="flex-row items-center gap-1">
            <View className={`h-2 w-3 rounded-sm ${fill}`} />
            <Text className="text-[10px] text-muted-foreground">{label}</Text>
          </View>
        ))}
      </View>
      <Text className="text-xs leading-4 text-muted-foreground">
        Pale band: plan. Colored bar: first arrival to last departure. Blue edges: together. Pale
        inset bands show waiting and lingering; without overlap, the whole bar is dead time. Press a
        layer for details. Missed means no time in the current together block.
      </Text>
    </View>
  );
}
