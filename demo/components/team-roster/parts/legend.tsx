import { Text, View } from 'react-native';
import { KIND_CLASSES } from '../utils/tones';

/** Swatches for the layers and event kinds drawn in the roster. */
export function TeamLegend() {
  return (
    <View className="flex-row flex-wrap items-center gap-4">
      <LegendItem
        swatch="h-3 w-5 rounded border border-emerald-500/40 bg-emerald-500/15"
        label="Working hours"
      />
      {Object.values(KIND_CLASSES).map((kind) => (
        <LegendItem
          key={kind.label}
          swatch={`h-3 w-3 rounded-full ${kind.dot}`}
          label={kind.label}
        />
      ))}
      <LegendItem
        swatch="h-3 w-5 rounded border border-dashed border-grid-strong bg-muted"
        label="Out of office"
      />
    </View>
  );
}

function LegendItem({ swatch, label }: { swatch: string; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className={swatch} />
      <Text className="text-[11px] text-muted-foreground">{label}</Text>
    </View>
  );
}
