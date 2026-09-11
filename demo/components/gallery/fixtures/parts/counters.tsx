import { Text, View } from 'react-native';
import type { CounterSnapshot } from '../counter-bridge.types';

export function GalleryCounters({
  snapshot,
  selection,
}: {
  snapshot: CounterSnapshot;
  selection: string;
}) {
  return (
    <View className="gap-1">
      <Text className="text-xs text-muted-foreground">
        Expanded {snapshot.expanded} · Layout {snapshot.layout.runs} runs /{' '}
        {snapshot.layout.cacheHits} hits · Coverage {snapshot.coverage.runs} runs /{' '}
        {snapshot.coverage.cacheHits} hits
      </Text>
      <Text
        testID="roster-selection"
        accessibilityLiveRegion="polite"
        numberOfLines={2}
        className="text-xs text-foreground"
      >
        {selection}
      </Text>
    </View>
  );
}
