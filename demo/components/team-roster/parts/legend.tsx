import { Text, View } from 'react-native';
import { KIND_CLASSES } from '../utils/tones';

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
        swatch="h-3 w-5 rounded border border-dashed border-zinc-700 bg-zinc-900"
        label="Out of office"
      />
      <Text className="text-[11px] text-zinc-600">
        Press a person, an event, or empty time to inspect it.
      </Text>
    </View>
  );
}

function LegendItem({ swatch, label }: { swatch: string; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className={swatch} />
      <Text className="text-[11px] text-zinc-400">{label}</Text>
    </View>
  );
}
